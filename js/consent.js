/**
 * Google Consent Mode v2 — dataLayer shape matches Google’s basic consent guide:
 * https://developers.google.com/tag-platform/security/guides/consent?consentmode=basic
 *
 * CMP_MODE: 'mock' | 'onetrust' | 'cookiebot'
 * Load synchronously in <head> BEFORE cmp-mock.js and GTM.
 *
 * dataLayer consent entries (only these gtag consent pushes; no custom consent events):
 *   ['consent', 'default', { ad_user_data, ad_personalization, ad_storage, analytics_storage, wait_for_update }]
 *   ['consent', 'update',  { ad_user_data, ad_personalization, ad_storage, analytics_storage }]
 *
 * Console: dataLayer.filter(e => e && e[0] === 'consent')
 *          localStorage.getItem('surf_consent')
 *
 * --- GTM setup (manual) ---
 * 1. GTM Admin → Container settings → enable consent overview / Advanced Consent Mode.
 * 2. GA4 tags: require analytics_storage.
 * 3. Ads / pixel tags: require ad_storage, ad_user_data, ad_personalization as needed.
 */
(function (window) {
  "use strict";

  var STORAGE_KEY = "surf_consent";
  var CMP_MODE = "mock";

  var CONSENT_DEFAULT = {
    ad_user_data: "denied",
    ad_personalization: "denied",
    ad_storage: "denied",
    analytics_storage: "denied",
    wait_for_update: 500,
  };

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag() {
      window.dataLayer.push(arguments);
    };

  /** Key order matches Google’s consent v2 examples. */
  function toConsentParams(analyticsGranted, marketingGranted) {
    return {
      ad_user_data: marketingGranted ? "granted" : "denied",
      ad_personalization: marketingGranted ? "granted" : "denied",
      ad_storage: marketingGranted ? "granted" : "denied",
      analytics_storage: analyticsGranted ? "granted" : "denied",
    };
  }

  function readStored() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function writeStored(payload) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      /* ignore quota / private mode */
    }
  }

  function storedToConsentParams(stored) {
    if (stored.categories) {
      return toConsentParams(stored.categories.analytics, stored.categories.marketing);
    }
    if (stored.consent) {
      return toConsentParams(
        stored.consent.analytics_storage === "granted",
        stored.consent.ad_storage === "granted"
      );
    }
    return toConsentParams(false, false);
  }

  function updateConsentUI() {
    var statusEl = document.getElementById("consent-qa-status");
    if (!statusEl) return;
    var state = window.SurfConsent.getConsentState();
    var stored = readStored() ? "yes" : "no";
    statusEl.textContent =
      "Analytics: " +
      state.consent.analytics_storage +
      " | Marketing: " +
      state.consent.ad_storage +
      " | Source: " +
      (state.source || "none") +
      " | Stored: " +
      stored;
  }

  function applyConsent(categories, source) {
    var analytics = !!categories.analytics;
    var marketing = !!categories.marketing;
    var consentParams = toConsentParams(analytics, marketing);

    window.gtag("consent", "update", consentParams);

    var payload = {
      categories: {
        necessary: true,
        analytics: analytics,
        marketing: marketing,
      },
      consent: consentParams,
      updatedAt: new Date().toISOString(),
      source: source || "unknown",
    };

    writeStored(payload);
    updateConsentUI();

    window.dispatchEvent(
      new CustomEvent("surf:consent-updated", { detail: payload })
    );

    return payload;
  }

  function restoreConsentFromStorage() {
    var stored = readStored();
    if (!stored) return null;
    var consentParams = storedToConsentParams(stored);
    window.gtag("consent", "update", consentParams);
    return stored;
  }

  window.gtag("consent", "default", CONSENT_DEFAULT);

  restoreConsentFromStorage();

  window.SurfConsent = {
    STORAGE_KEY: STORAGE_KEY,
    CMP_MODE: CMP_MODE,
    CONSENT_DEFAULT: CONSENT_DEFAULT,

    getConsentState: function () {
      var stored = readStored();
      if (stored) {
        return {
          categories: stored.categories,
          consent: storedToConsentParams(stored),
          source: stored.source,
          updatedAt: stored.updatedAt,
          hasStoredChoice: true,
        };
      }
      return {
        categories: { necessary: true, analytics: false, marketing: false },
        consent: toConsentParams(false, false),
        source: null,
        updatedAt: null,
        hasStoredChoice: false,
      };
    },

    applyConsent: function (categories, source) {
      return applyConsent(
        {
          analytics: categories.analytics,
          marketing: categories.marketing,
        },
        source
      );
    },

    grantAllConsent: function (source) {
      return applyConsent({ analytics: true, marketing: true }, source || "qa");
    },

    denyAllConsent: function (source) {
      return applyConsent(
        { analytics: false, marketing: false },
        source || "qa"
      );
    },

    resetConsent: function () {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        /* ignore */
      }
      window.gtag("consent", "update", toConsentParams(false, false));
      updateConsentUI();
      window.dispatchEvent(new CustomEvent("surf:consent-reset"));
    },

    hasStoredChoice: function () {
      return !!readStored();
    },
  };

  function injectQaBar() {
    if (document.getElementById("consent-qa-bar")) return;

    var bar = document.createElement("div");
    bar.id = "consent-qa-bar";
    bar.className = "consent-qa-bar";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Consent QA controls");
    bar.innerHTML =
      '<div class="consent-qa-inner">' +
      '<span class="consent-qa-label">Consent QA</span>' +
      '<span id="consent-qa-status" class="consent-qa-status"></span>' +
      '<div class="consent-qa-actions">' +
      '<button type="button" class="btn consent-qa-btn" data-action="grant">Accept all</button>' +
      '<button type="button" class="btn btn-secondary consent-qa-btn" data-action="deny">Reject all</button>' +
      '<button type="button" class="btn consent-qa-btn consent-qa-btn-reset" data-action="reset">Reset</button>' +
      "</div></div>";

    bar.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-action]");
      if (!btn) return;
      var action = btn.getAttribute("data-action");
      if (action === "grant") {
        window.SurfConsent.grantAllConsent("qa");
        if (window.SurfCmpMock) {
          window.SurfCmpMock.hideBanner();
          window.SurfCmpMock.closeModal();
        }
      } else if (action === "deny") {
        window.SurfConsent.denyAllConsent("qa");
        if (window.SurfCmpMock) {
          window.SurfCmpMock.hideBanner();
          window.SurfCmpMock.closeModal();
        }
      } else if (action === "reset") {
        window.SurfConsent.resetConsent();
        if (window.SurfCmpMock) {
          window.SurfCmpMock.showBanner();
          window.SurfCmpMock.closeModal();
        }
      }
    });

    document.body.appendChild(bar);
    document.body.classList.add("consent-qa-active");
    updateConsentUI();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectQaBar);
  } else {
    injectQaBar();
  }

  window.addEventListener("surf:consent-updated", updateConsentUI);
  window.addEventListener("surf:consent-reset", updateConsentUI);
})(window);
