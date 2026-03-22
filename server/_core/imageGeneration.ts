/**
 * Image generation helper — supports two backends:
 *
 * 1. OpenAI gpt-image-1 (recommended for Railway / Render / VPS deployments)
 *    Set OPENAI_API_KEY in your environment variables.
 *    Docs: https://platform.openai.com/docs/guides/image-generation
 *
 * 2. Manus Forge (used automatically when running inside the Manus platform)
 *    BUILT_IN_FORGE_API_KEY and BUILT_IN_FORGE_API_URL are injected automatically.
 *
 * Priority: OpenAI is used if OPENAI_API_KEY is set. Manus Forge is the fallback.
 *
 * Example usage:
 *   const { url } = await generateImage({
 *     prompt: "A serene landscape with mountains",
 *     originalImages: [{ url: "https://example.com/photo.jpg", mimeType: "image/jpeg" }]
 *   });
 */
import { storagePut } from "server/storage";
import { ENV } from "./env";

export type GenerateImageOptions = {
  prompt: string;
  originalImages?: Array<{
    url?: string;
    b64Json?: string;
    mimeType?: string;
  }>;
};

export type GenerateImageResponse = {
  url?: string;
};

// ---------------------------------------------------------------------------
// OpenAI backend (gpt-image-1 with image editing)
// ---------------------------------------------------------------------------
async function generateImageWithOpenAI(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  const apiKey = ENV.openAiApiKey;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const hasSourceImage =
    options.originalImages && options.originalImages.length > 0;

  if (hasSourceImage) {
    // Use the image edit endpoint (requires multipart/form-data)
    const formData = new FormData();
    formData.append("model", "gpt-image-1");
    formData.append("prompt", options.prompt);
    formData.append("n", "1");
    formData.append("size", "1024x1024");

    // Attach the source image — prefer b64Json, fall back to URL fetch
    const src = options.originalImages![0];
    let imageBlob: Blob;

    if (src.b64Json) {
      const binary = Buffer.from(src.b64Json, "base64");
      imageBlob = new Blob([binary], {
        type: src.mimeType ?? "image/png",
      });
    } else if (src.url) {
      const resp = await fetch(src.url);
      if (!resp.ok)
        throw new Error(`Failed to fetch source image: ${resp.status}`);
      imageBlob = await resp.blob();
    } else {
      throw new Error("originalImages entry must have either url or b64Json");
    }

    formData.append("image", imageBlob, "source.png");

    const response = await fetch(
      "https://api.openai.com/v1/images/edits",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: formData,
      }
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        `OpenAI image edit failed (${response.status})${detail ? `: ${detail}` : ""}`
      );
    }

    const result = (await response.json()) as {
      data: Array<{ b64_json?: string; url?: string }>;
    };

    const item = result.data[0];
    if (!item) throw new Error("OpenAI returned no image data");

    if (item.b64_json) {
      const buffer = Buffer.from(item.b64_json, "base64");
      const { url } = await storagePut(
        `generated/${Date.now()}.png`,
        buffer,
        "image/png"
      );
      return { url };
    }

    if (item.url) {
      // Download and re-upload to S3 so we have a stable CDN URL
      const imgResp = await fetch(item.url);
      const arrayBuf = await imgResp.arrayBuffer();
      const { url } = await storagePut(
        `generated/${Date.now()}.png`,
        Buffer.from(arrayBuf),
        "image/png"
      );
      return { url };
    }

    throw new Error("OpenAI returned neither b64_json nor url");
  } else {
    // Text-to-image generation (no source image)
    const response = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt: options.prompt,
          n: 1,
          size: "1024x1024",
          response_format: "b64_json",
        }),
      }
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        `OpenAI image generation failed (${response.status})${detail ? `: ${detail}` : ""}`
      );
    }

    const result = (await response.json()) as {
      data: Array<{ b64_json?: string; url?: string }>;
    };

    const item = result.data[0];
    if (!item) throw new Error("OpenAI returned no image data");

    if (item.b64_json) {
      const buffer = Buffer.from(item.b64_json, "base64");
      const { url } = await storagePut(
        `generated/${Date.now()}.png`,
        buffer,
        "image/png"
      );
      return { url };
    }

    throw new Error("OpenAI returned no b64_json for text-to-image");
  }
}

// ---------------------------------------------------------------------------
// Manus Forge backend (internal platform, auto-injected credentials)
// ---------------------------------------------------------------------------
async function generateImageWithForge(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  if (!ENV.forgeApiUrl) throw new Error("BUILT_IN_FORGE_API_URL is not configured");
  if (!ENV.forgeApiKey) throw new Error("BUILT_IN_FORGE_API_KEY is not configured");

  const baseUrl = ENV.forgeApiUrl.endsWith("/")
    ? ENV.forgeApiUrl
    : `${ENV.forgeApiUrl}/`;
  const fullUrl = new URL(
    "images.v1.ImageService/GenerateImage",
    baseUrl
  ).toString();

  const response = await fetch(fullUrl, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "connect-protocol-version": "1",
      authorization: `Bearer ${ENV.forgeApiKey}`,
    },
    body: JSON.stringify({
      prompt: options.prompt,
      original_images: options.originalImages || [],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Forge image generation failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
    );
  }

  const result = (await response.json()) as {
    image: { b64Json: string; mimeType: string };
  };
  const buffer = Buffer.from(result.image.b64Json, "base64");
  const { url } = await storagePut(
    `generated/${Date.now()}.png`,
    buffer,
    result.image.mimeType
  );
  return { url };
}

// ---------------------------------------------------------------------------
// Public entry point — auto-selects backend based on available credentials
// ---------------------------------------------------------------------------
export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  if (ENV.openAiApiKey) {
    return generateImageWithOpenAI(options);
  }
  if (ENV.forgeApiUrl && ENV.forgeApiKey) {
    return generateImageWithForge(options);
  }
  throw new Error(
    "No image generation backend configured. " +
    "Set OPENAI_API_KEY (recommended) or BUILT_IN_FORGE_API_KEY + BUILT_IN_FORGE_API_URL."
  );
}
