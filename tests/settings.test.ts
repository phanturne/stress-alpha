import { describe, it, expect } from "vitest";
import { getTranslations } from "@/lib/i18n";
import fs from "fs";
import path from "path";

describe("Settings Page & Privacy Architecture", () => {
  describe("Dedicated Settings Page Translations & i18n Invariants", () => {
    it("provides complete pre-localized settingsPage translations in English and Chinese", () => {
      const en = getTranslations("en").settingsPage;
      const zh = getTranslations("zh").settingsPage;

      // Page Title & Subtitle
      expect(en.title).toBe("Settings & Preferences");
      expect(zh.title).toBe("偏好与系统设置");
      expect(en.subtitle).toBeTruthy();
      expect(zh.subtitle).toBeTruthy();

      // Navigation Buttons
      expect(en.backToModel).toBeTruthy();
      expect(zh.backToModel).toBeTruthy();
      expect(en.backToScreener).toBeTruthy();
      expect(zh.backToScreener).toBeTruthy();

      // Category Tabs
      expect(en.tabAccount).toBeTruthy();
      expect(zh.tabAccount).toBeTruthy();
      expect(en.tabAppearance).toBeTruthy();
      expect(zh.tabAppearance).toBeTruthy();
      expect(en.tabValuation).toBeTruthy();
      expect(zh.tabValuation).toBeTruthy();
      expect(en.tabPrivacy).toBeTruthy();
      expect(zh.tabPrivacy).toBeTruthy();
      expect(en.tabSystem).toBeTruthy();
      expect(zh.tabSystem).toBeTruthy();

      // Account Panel
      expect(en.account.title).toBeTruthy();
      expect(zh.account.title).toBeTruthy();
      expect(en.account.emailPrivacyNotice).toBeTruthy();
      expect(zh.account.emailPrivacyNotice).toBeTruthy();
      expect(en.account.showEmail).toBeTruthy();
      expect(zh.account.hideEmail).toBeTruthy();
      expect(en.account.signOutButton).toBeTruthy();
      expect(zh.account.signOutButton).toBeTruthy();

      // Appearance Panel
      expect(en.appearance.themeDarkTitle).toContain("Bloomberg");
      expect(zh.appearance.themeDarkTitle).toContain("彭博终端");
      expect(en.appearance.themeLightTitle).toContain("FactSet");
      expect(zh.appearance.themeLightTitle).toContain("FactSet");
      expect(en.appearance.langEnTitle).toBeTruthy();
      expect(zh.appearance.langZhTitle).toBeTruthy();

      // Valuation Defaults Panel
      expect(en.valuation.qpceTitle).toBeTruthy();
      expect(zh.valuation.qpceTitle).toBeTruthy();
      expect(en.valuation.guardrailTitle).toBeTruthy();
      expect(zh.valuation.guardrailTitle).toBeTruthy();
      expect(en.valuation.feedsTitle).toBeTruthy();
      expect(zh.valuation.feedsTitle).toBeTruthy();

      // Privacy Panel
      expect(en.privacy.dropdownPrivacyTitle).toBeTruthy();
      expect(zh.privacy.dropdownPrivacyTitle).toBeTruthy();
      expect(en.privacy.dropdownPrivacyDesc).toBeTruthy();
      expect(zh.privacy.dropdownPrivacyDesc).toBeTruthy();
      expect(en.privacy.clearCacheButton).toBeTruthy();
      expect(zh.privacy.clearCacheButton).toBeTruthy();
      expect(en.privacy.clearCacheSuccess).toBeTruthy();
      expect(zh.privacy.clearCacheSuccess).toBeTruthy();

      // System Panel
      expect(en.system.versionLabel).toBeTruthy();
      expect(zh.system.versionLabel).toBeTruthy();
      expect(en.system.methodologyLink).toBeTruthy();
      expect(zh.system.methodologyLink).toBeTruthy();
    });

    it("provides header and auth settings translations in English and Chinese", () => {
      const enHeader = getTranslations("en").header;
      const zhHeader = getTranslations("zh").header;
      const enAuth = getTranslations("en").auth;
      const zhAuth = getTranslations("zh").auth;

      expect(enHeader.settingsPage).toBe("Settings & Preferences");
      expect(zhHeader.settingsPage).toBe("偏好与系统设置");

      expect(enAuth.memberBadge).toBe("Member");
      expect(zhAuth.memberBadge).toBe("会员分析师");
    });
  });

  describe("Privacy Guardrail: Email Concealment in Dropdowns", () => {
    it("ensures Header.tsx does not display raw session.user.email anywhere in menus or mobile drawers", () => {
      const headerPath = path.resolve(
        process.cwd(),
        "src/components/Header.tsx"
      );
      const headerCode = fs.readFileSync(headerPath, "utf-8");

      // Verify session.user.email is never referenced in Header.tsx
      expect(headerCode).not.toContain("session.user.email");
      expect(headerCode).not.toContain(".email");

      // Verify Header.tsx has direct links to /settings
      expect(headerCode).toContain('href="/settings"');
    });

    it("verifies Settings page files exist and are correctly structured", () => {
      const settingsPagePath = path.resolve(
        process.cwd(),
        "src/app/settings/page.tsx"
      );
      const settingsClientPath = path.resolve(
        process.cwd(),
        "src/app/settings/SettingsClientPage.tsx"
      );

      expect(fs.existsSync(settingsPagePath)).toBe(true);
      expect(fs.existsSync(settingsClientPath)).toBe(true);

      const clientCode = fs.readFileSync(settingsClientPath, "utf-8");
      // Check that client component has email masking logic for shoulder-surfing protection
      expect(clientCode).toContain("maskEmail");
      // Check that client component provides user toggle to reveal email privately
      expect(clientCode).toContain("setShowRawEmail");

      // Verify user id is not displayed in the account panel
      expect(clientCode).not.toContain("session.user.id");
      expect(clientCode).not.toContain("userIdLabel");

      // Verify "Connected to Neon PostgreSQL" is not displayed in the account panel
      expect(clientCode).not.toContain("statusConnected");
      expect(clientCode).not.toContain("Connected to Neon PostgreSQL");
    });
  });
});
