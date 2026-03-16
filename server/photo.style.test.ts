import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the imageGeneration module
vi.mock("./_core/imageGeneration", () => ({
  generateImage: vi.fn().mockResolvedValue({ url: "https://cdn.example.com/generated/test.png" }),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("photo.styleTransfer", () => {
  it("rejects invalid style values", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.photo.styleTransfer({
        imageDataUrl: "data:image/jpeg;base64,/9j/abc",
        style: "watercolor" as "pokemon",
      })
    ).rejects.toThrow();
  });

  it("rejects empty imageDataUrl", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.photo.styleTransfer({
        imageDataUrl: "",
        style: "pokemon",
      })
    ).rejects.toThrow();
  });

  it("rejects malformed data URL", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.photo.styleTransfer({
        imageDataUrl: "not-a-data-url",
        style: "kawaii",
      })
    ).rejects.toThrow("Invalid image data URL");
  });

  it("calls generateImage with correct prompt for pokemon style", async () => {
    const { generateImage } = await import("./_core/imageGeneration");
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const fakeDataUrl = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=";

    const result = await caller.photo.styleTransfer({
      imageDataUrl: fakeDataUrl,
      style: "pokemon",
    });

    expect(generateImage).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining("Pokémon"),
        originalImages: expect.arrayContaining([
          expect.objectContaining({ mimeType: "image/jpeg" }),
        ]),
      })
    );
    expect(result.url).toBe("https://cdn.example.com/generated/test.png");
  });
});
