import { z } from "zod";
import { ConversionSettings } from "../types/index.js";

// Zod schema for conversion settings validation
export const ConversionSettingsSchema = z
  .object({
    quality: z.enum(["high", "medium", "small"]).default("high"),
    pageOrientation: z
      .enum(["portrait", "landscape", "auto"])
      .default("portrait"),
    pageSize: z
      .enum(["A4", "Letter", "Legal", "A3", "A5", "custom"])
      .default("A4"),
    margins: z.enum(["normal", "narrow", "wide", "custom"]).default("normal"),
    includeImages: z.boolean().default(true),
    includeHyperlinks: z.boolean().default(true),
    passwordProtect: z.boolean().default(false),
    password: z.string().optional(),
    watermark: z.boolean().default(false),
    watermarkText: z.string().optional(),
  })
  .refine(
    (data) => {
      // If password protection is enabled, password must be provided
      if (
        data.passwordProtect &&
        (!data.password || data.password.length < 4)
      ) {
        return false;
      }
      // If watermark is enabled, watermark text must be provided
      if (
        data.watermark &&
        (!data.watermarkText || data.watermarkText.trim().length === 0)
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        "Password must be at least 4 characters when password protection is enabled, and watermark text is required when watermark is enabled",
    }
  );

export function validateConversionSettings(settings: unknown): {
  success: boolean;
  data?: ConversionSettings;
  error?: string;
} {
  try {
    const result = ConversionSettingsSchema.parse(settings);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join(", ");
      return { success: false, error: errorMessages };
    }
    return { success: false, error: "Invalid settings format" };
  }
}

export function parseSettingsFromRequest(
  settingsString?: string
): ConversionSettings {
  if (!settingsString) {
    return ConversionSettingsSchema.parse({});
  }

  try {
    const parsed = JSON.parse(settingsString);
    return ConversionSettingsSchema.parse(parsed);
  } catch (error) {
    // Return default settings if parsing fails
    return ConversionSettingsSchema.parse({});
  }
}
