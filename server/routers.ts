import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { generateImage } from "./_core/imageGeneration";
import { z } from "zod";

const STYLE_PROMPTS: Record<string, string> = {
  pokemon: `Redraw this animal as an official Pokémon species illustration in the exact style of Ken Sugimori's original Pokémon Red/Blue/Yellow artwork and the Pokémon Trading Card Game. Requirements:
- CRITICAL: Preserve every fur/feather marking, patch, and color zone EXACTLY as they appear in the source photo. If the animal has a white face and ginger ears, draw it with a white face and ginger ears. Do not invent or move markings.
- Bold, clean black ink outlines with consistent line weight, just like official Pokémon sprites
- Flat cel-shaded colors with simple two-tone shading (light side and shadow side only), no gradients
- Large, expressive circular eyes with a white highlight dot, in the classic Sugimori style
- Slightly chibi proportions: head slightly larger than body, compact limbs
- Background: a soft nature scene typical of Pokémon TCG art — gentle rolling hills, a few stylized trees or bushes, a light blue sky with fluffy clouds. Muted, non-distracting colors so the animal is the clear focus.
- The result must look like it could be printed on an official Pokémon card — not a generic cartoon, specifically Pokémon TCG art`,

  kawaii: `Redraw this animal in a Japanese kawaii illustration style, like a character from San-X or Sumikko Gurashi stationery. Requirements:
- CRITICAL: Preserve every fur/feather marking, patch, and color zone EXACTLY as they appear in the source photo. Match the animal's actual coat colors and patterns precisely — do not change, blend, or move any markings.
- Soft, muted pastel version of the animal's real colors (slightly desaturated, not neon)
- Oversized round head, tiny dot nose, very small mouth
- Large glossy eyes with multiple sparkle highlights and a soft gradient
- Rosy circular blush marks on cheeks
- Clean, thin outlines with a slightly wobbly hand-drawn feel
- Background: a dreamy pastel scene — a soft pink or lavender sky, tiny floating stars, hearts, and flowers, maybe a small rainbow or pastel clouds. The background should feel magical and gentle, complementing the animal without competing with it.
- Overall mood: gentle, sweet, and irresistibly huggable`,

  comic: `Redraw this animal as a bold American comic book illustration in the style of classic Marvel/DC comics or a Sunday newspaper comic strip. Requirements:
- CRITICAL: Preserve every fur/feather marking, patch, and color zone EXACTLY as they appear in the source photo. The animal's actual coat colors and patterns must be clearly recognizable in the final illustration.
- Strong, confident black ink outlines with varied line weight (thicker on outer edges, thinner for interior details)
- Bold, saturated colors — use the animal's real colors but make them vivid and punchy
- Classic halftone dot shading in shadow areas
- Expressive, slightly exaggerated features with personality
- Dynamic pose with a sense of energy
- Background: a bold comic book scene — a solid color with halftone dots, or a simple cityscape/action background with speed lines radiating outward. Add a small starburst or speech bubble shape if it fits. The background should feel energetic but not overwhelm the animal.
- The result should feel like it belongs in a printed comic book or graphic novel`,

  watercolor: `Redraw this animal as a beautiful hand-painted watercolor illustration. Requirements:
- CRITICAL: Preserve every fur/feather marking, patch, and color zone EXACTLY as they appear in the source photo. The animal's actual coat colors and patterns must be faithfully represented — do not change or move any markings.
- Soft, flowing watercolor washes with visible paper texture and natural pigment blooms
- Wet-on-wet blending at the edges of color areas, with gentle color bleeds where fur colors meet
- Delicate, loose ink or pencil outlines that are slightly imprecise and organic — not digital-clean
- Warm, luminous colors with a slightly faded, painterly quality
- Background: a soft, loose watercolor wash of complementary colors — perhaps a warm golden meadow, a soft blue-green garden, or gentle abstract color blooms. The background should bleed softly at the edges, giving the impression of a painted scene. Leave some areas of the background unpainted (white paper showing through) for an airy, light feel.
- The overall result should look like a beautiful illustration from a nature field guide or a children's picture book`,
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
        style: z.enum(["pokemon", "kawaii", "comic", "watercolor"]),
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
