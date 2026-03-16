import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { generateImage } from "./_core/imageGeneration";
import { z } from "zod";

const STYLE_PROMPTS: Record<string, string> = {
  pokemon: "Transform this photo into a Pokémon-style illustration. Use the bold outlines, vibrant flat colors, and charming chibi proportions of official Pokémon artwork. The animal should look like an official Pokémon card illustration — cute, expressive, and full of personality. Keep the animal recognizable but stylized.",
  kawaii: "Transform this photo into a kawaii Japanese illustration style. Use soft pastel colors, large sparkling eyes, rosy cheeks, tiny features, and an adorable chibi aesthetic. The animal should look like a character from a Japanese stationery or sticker sheet — sweet, round, and irresistibly cute.",
  comic: "Transform this photo into a bold American comic book illustration. Use strong ink outlines, dynamic halftone dot shading, vivid primary colors, and a retro pop-art feel. The animal should look like it belongs in a comic strip — expressive, energetic, and full of character.",
};

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  photo: router({
    styleTransfer: publicProcedure
      .input(z.object({
        imageDataUrl: z.string().min(1),
        style: z.enum(["pokemon", "kawaii", "comic"]),
      }))
      .mutation(async ({ input }) => {
        const prompt = STYLE_PROMPTS[input.style];

        // Strip the data: URL prefix to get raw base64
        const base64Match = input.imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!base64Match) {
          throw new Error("Invalid image data URL");
        }
        const mimeType = base64Match[1];
        const b64Json = base64Match[2];

        const result = await generateImage({
          prompt,
          originalImages: [{ b64Json, mimeType }],
        });

        if (!result.url) {
          throw new Error("Image generation returned no URL");
        }

        return { url: result.url };
      }),
  }),
});

export type AppRouter = typeof appRouter;
