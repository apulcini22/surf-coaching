/**
 * Google Consent Mode v2 — dataLayer shape matches Google’s basic consent guide:
 * https://developers.google.com/tag-platform/security/guides/consent?consentmode=basic
 *
 * dataLayer consent entries:
 *   ['consent', 'default', { ad_user_data, ad_personalization, ad_storage, analytics_storage, wait_for_update }]
 *   ['consent', 'update',  { ad_user_data, ad_personalization, ad_storage, analytics_storage }]
 *
 * Console: dataLayer.filter(e => e && e[0] === 'consent')
 *          localStorage.getItem('surf_consent')
 */
(function (window) {
  "use strict";

  var STORAGE_KEY = "surf_consent";
  var CMP_MODE = "mock";

  var CONSENT_TYPES = [
    "ad_user_data",
    "ad_personalization",
    "ad_storage",
    "analytics_storage",
  ];

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

  function toStatus(granted) {
    return granted ? "granted" : "denied";
  }

  /** Google key order from booleans per type. */
  function buildConsentParams(settings) {
    return {
      ad_user_data: toStatus(!!settings.ad_user_data),
      ad_personalization: toStatus(!!settings.ad_personalization),
      ad_storage: toStatus(!!settings.ad_storage),
      analytics_storage: toStatus(!!settings.analytics_storage),
    };
  }

  function consentParamsToSettings(consentParams) {
    var settings = {};
    CONSENT_TYPES.forEach(function (key) {
      settings[key] = consentParams[key] === "granted";
    });
    return settings;
  }

  function allDeniedSettings() {
    return {
      ad_user_data: false,
      ad_personalization: false,
      ad_storage: false,
      analytics_storage: false,
    };
  }

  function allGrantedSettings() {
    return {
      ad_user_data: true,
      ad_personalization: true,
      ad_storage: true,
      analytics_storage: true,
    };
  }

  /** Category presets (banner quick actions). */
  function toConsentParamsFromCategories(analyticsGranted, marketingGranted) {
    return buildConsentParams({
      analytics_storage: analyticsGranted,
      ad_storage: marketingGranted,
      ad_user_data: marketingGranted,
      ad_personalization: marketingGranted,
    });
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
      /* ignore */
    }
  }

  function storedToConsentParams(stored) {
    if (stored.consent && stored.consent.analytics_storage) {
      return {
        ad_user_data: stored.consent.ad_user_data,
        ad_personalization: stored.consent.ad_personalization,
        ad_storage: stored.consent.ad_storage,
        analytics_storage: stored.consent.analytics_storage,
      };
    }
    if (stored.categories) {
      return toConsentParamsFromCategories(
        stored.categories.analytics,
        stored.categories.marketing
      );
    }
    return buildConsentParams(allDeniedSettings());
  }

  function updateConsentUI() {
    var statusEl = document.getElementById("consent-qa-status");
    if (!statusEl) return;
    var state = window.SurfConsent.getConsentState();
    var stored = readStored() ? "yes" : "no";
    statusEl.textContent =
      "ad_user_data: " +
      state.consent.ad_user_data +
      " | ad_personalization: " +
      state.consent.ad_personalization +
      " | ad_storage: " +
      state.consent.ad_storage +
      " | analytics_storage: " +
      state.consent.analytics_storage +
      " | Stored: " +
      stored;

    syncGranularCheckboxes(state.settings);
  }

  function syncGranularCheckboxes(settings) {
    CONSENT_TYPES.forEach(function (key) {
      var el = document.getElementById("qa-" + key);
      if (el) el.checked = !!settings[key];
    });
  }

  function readGranularFromQA() {
    var settings = {};
    CONSENT_TYPES.forEach(function (key) {
      var el = document.getElementById("qa-" + key);
      settings[key] = el ? el.checked : false;
    });
    return settings;
  }

  function applyConsentParams(consentParams, source) {
    window.gtag("consent", "update", consentParams);

    var settings = consentParamsToSettings(consentParams);
    var payload = {
      consent: consentParams,
      settings: settings,
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

  function applyConsent(categories, source) {
    var consentParams = toConsentParamsFromCategories(
      !!categories.analytics,
      !!categories.marketing
    );
    return applyConsentParams(consentParams, source);
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
    CONSENT_TYPES: CONSENT_TYPES,

    getConsentState: function () {
      var stored = readStored();
      if (stored) {
        var consent = storedToConsentParams(stored);
        return {
          consent: consent,
          settings: stored.settings || consentParamsToSettings(consent),
          source: stored.source,
          updatedAt: stored.updatedAt,
          hasStoredChoice: true,
        };
      }
      return {
        consent: buildConsentParams(allDeniedSettings()),
        settings: allDeniedSettings(),
        source: null,
        updatedAt: null,
        hasStoredChoice: false,
      };
    },

    applyConsent: function (categories, source) {
      return applyConsent(categories, source);
    },

    applyGranularConsent: function (settings, source) {
      return applyConsentParams(buildConsentParams(settings), source || "granular");
    },

    grantAllConsent: function (source) {
      return applyConsentParams(
        buildConsentParams(allGrantedSettings()),
        source || "qa"
      );
    },

    denyAllConsent: function (source) {
      return applyConsentParams(
        buildConsentParams(allDeniedSettings()),
        source || "qa"
      );
    },

    resetConsent: function () {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        /* ignore */
      }
      window.gtag("consent", "update", buildConsentParams(allDeniedSettings()));
      updateConsentUI();
      window.dispatchEvent(new CustomEvent("surf:consent-reset"));
    },

    hasStoredChoice: function () {
      return !!readStored();
    },

    syncGranularCheckboxes: syncGranularCheckboxes,
  };

  function injectQaBar() {
    if (document.getElementById("consent-qa-bar")) return;

    var granularLabels = CONSENT_TYPES.map(function (key) {
      return (
        '<label class="consent-granular-item">' +
        '<input type="checkbox" id="qa-' +
        key +
        '" data-consent-type="' +
        key +
        '" /> ' +
        "<code>" +
        key +
        "</code></label>"
      );
    }).join("");

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
      '<button type="button" class="btn consent-qa-btn consent-qa-btn-toggle" data-action="toggle-granular">Per-type testing</button>' +
      '<button type="button" class="btn consent-qa-btn consent-qa-btn-apply" data-action="apply-granular">Apply selection</button>' +
      "</div>" +
      '<div id="consent-granular-panel" class="consent-granular-panel cmp-hidden">' +
      '<p class="consent-granular-hint">Toggle each Google consent type, then Apply selection.</p>' +
      '<div class="consent-granular-grid">' +
      granularLabels +
      "</div></div></div>";

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
      } else if (action === "toggle-granular") {
        var panel = document.getElementById("consent-granular-panel");
        if (panel) panel.classList.toggle("cmp-hidden");
        document.body.classList.toggle("consent-granular-open");
      } else if (action === "apply-granular") {
        window.SurfConsent.applyGranularConsent(readGranularFromQA(), "qa-granular");
        if (window.SurfCmpMock) {
          window.SurfCmpMock.hideBanner();
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
