import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// Hands-On Fitness "Calm Active" theme — Material 3.
// Type: Outfit (display/timer/headings) + Manrope (body).
// See design-preview.html for visual reference.
class HofColors {
  static const bgLight = Color(0xFFFAF7F2);
  static const ink = Color(0xFF1A1D21);
  static const muted = Color(0xFF6B7280);
  static const workout = Color(0xFFFF6B5B); // coral
  static const yoga = Color(0xFF0E7C6B); // deep teal
  static const yogaSoft = Color(0xFF4CAF82); // sage
  static const streak = Color(0xFFFFB020); // amber
  static const bgDark = Color(0xFF121417);
}

final hofLightTheme = ThemeData(
  useMaterial3: true,
  scaffoldBackgroundColor: HofColors.bgLight,
  colorScheme: ColorScheme.fromSeed(
    seedColor: HofColors.workout,
    primary: HofColors.workout,
    secondary: HofColors.yoga,
    tertiary: HofColors.streak,
  ),
  textTheme: TextTheme(
    displayLarge: GoogleFonts.outfit(fontSize: 80, fontWeight: FontWeight.w800, letterSpacing: -1),
    titleLarge: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w700),
    bodyLarge: GoogleFonts.manrope(fontSize: 16, height: 1.5),
    labelLarge: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w700),
  ),
  cardTheme: CardThemeData(
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
    elevation: 0,
  ),
  filledButtonTheme: FilledButtonThemeData(
    style: FilledButton.styleFrom(
      minimumSize: const Size(72, 56),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    ),
  ),
);

final hofDarkTheme = ThemeData(
  useMaterial3: true,
  brightness: Brightness.dark,
  scaffoldBackgroundColor: HofColors.bgDark,
  colorScheme: ColorScheme.fromSeed(
    seedColor: HofColors.workout,
    brightness: Brightness.dark,
    primary: HofColors.workout,
    secondary: HofColors.yogaSoft,
    tertiary: HofColors.streak,
  ),
);
