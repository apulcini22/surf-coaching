/**
 * Mock CMP — cookie banner + preferences modal for Consent Mode testing.
 * Requires js/consent.js (SurfConsent) loaded first.
 */
(function (window) {
  "use strict";

  var bannerEl = null;
  var modalEl = null;
  var overlayEl = null;

  function getSettingsFromModal() {
    var settings = {};
    window.SurfConsent.CONSENT_TYPES.forEach(function (key) {
      var el = document.getElementById("cmp-" + key);
      settings[key] = el ? el.checked : false;
    });
    return settings;
  }

  function syncModalFromState() {
    var state = window.SurfConsent.getConsentState();
    window.SurfConsent.CONSENT_TYPES.forEach(function (key) {
      var el = document.getElementById("cmp-" + key);
      if (el) el.checked = !!state.settings[key];
    });
  }

  function saveFromModal(source) {
    window.SurfConsent.applyGranularConsent(
      getSettingsFromModal(),
      source || "cmp"
    );
    hideBanner();
    closeModal();
    window.SurfConsent.syncGranularCheckboxes(
      window.SurfConsent.getConsentState().settings
    );
  }

  function acceptAll() {
    window.SurfConsent.grantAllConsent("cmp");
    hideBanner();
    closeModal();
    syncModalFromState();
    window.SurfConsent.syncGranularCheckboxes(
      window.SurfConsent.getConsentState().settings
    );
  }

  function rejectNonEssential() {
    window.SurfConsent.denyAllConsent("cmp");
    hideBanner();
    closeModal();
    syncModalFromState();
    window.SurfConsent.syncGranularCheckboxes(
      window.SurfConsent.getConsentState().settings
    );
  }

  function buildConsentTypeRows() {
    var descriptions = {
      analytics_storage: "GA4 and site analytics.",
      ad_storage: "Ad cookies and conversion storage.",
      ad_user_data: "Sending user data to Google for advertising.",
      ad_personalization: "Personalized ads and remarketing.",
    };

    return window.SurfConsent.CONSENT_TYPES.map(function (key) {
      return (
        '<label class="cmp-category">' +
        '<input type="checkbox" id="cmp-' +
        key +
        '" />' +
        "<span><strong>" +
        key +
        "</strong><br />" +
        descriptions[key] +
        "</span></label>"
      );
    }).join("");
  }

  function buildBanner() {
    if (document.getElementById("cmp-banner")) return;

    bannerEl = document.createElement("div");
    bannerEl.id = "cmp-banner";
    bannerEl.className = "cmp-banner";
    bannerEl.setAttribute("role", "dialog");
    bannerEl.setAttribute("aria-label", "Cookie consent");
    bannerEl.innerHTML =
      '<div class="cmp-banner-inner container">' +
      '<div class="cmp-banner-text">' +
      "<h2>We value your privacy</h2>" +
      "<p>We use cookies to analyze site traffic and personalize ads. " +
      "You can accept all, reject non-essential cookies, or customize each consent type.</p>" +
      "</div>" +
      '<div class="cmp-banner-actions">' +
      '<button type="button" class="btn cmp-btn-accept" data-cmp="accept-all">Accept all</button>' +
      '<button type="button" class="btn btn-secondary cmp-btn-reject" data-cmp="reject">Reject non-essential</button>' +
      '<button type="button" class="btn cmp-btn-customize" data-cmp="customize">Customize</button>' +
      "</div></div>";

    bannerEl.addEventListener("click", function (e) {
      var action = e.target.getAttribute("data-cmp");
      if (!action) return;
      if (action === "accept-all") acceptAll();
      else if (action === "reject") rejectNonEssential();
      else if (action === "customize") openModal();
    });

    document.body.appendChild(bannerEl);
  }

  function buildModal() {
    if (document.getElementById("cmp-modal-overlay")) return;

    overlayEl = document.createElement("div");
    overlayEl.id = "cmp-modal-overlay";
    overlayEl.className = "cmp-modal-overlay cmp-hidden";
    overlayEl.setAttribute("aria-hidden", "true");

    modalEl = document.createElement("div");
    modalEl.id = "cmp-modal";
    modalEl.className = "cmp-modal";
    modalEl.setAttribute("role", "dialog");
    modalEl.setAttribute("aria-modal", "true");
    modalEl.setAttribute("aria-label", "Cookie preferences");
    modalEl.innerHTML =
      '<div class="cmp-modal-header">' +
      "<h2>Cookie settings</h2>" +
      '<button type="button" class="cmp-modal-close" aria-label="Close">&times;</button>' +
      "</div>" +
      '<div class="cmp-modal-body">' +
      '<p class="cmp-modal-intro">Set each Google Consent Mode v2 type individually for pixel testing.</p>' +
      '<label class="cmp-category cmp-category-disabled">' +
      '<input type="checkbox" checked disabled />' +
      "<span><strong>Strictly necessary</strong><br />Required for the site to function. Always on.</span>" +
      "</label>" +
      buildConsentTypeRows() +
      "</div>" +
      '<div class="cmp-modal-footer">' +
      '<button type="button" class="btn cmp-btn-save" data-cmp-modal="save">Save preferences</button>' +
      '<button type="button" class="btn cmp-btn-accept" data-cmp-modal="accept-all">Accept all</button>' +
      '<button type="button" class="btn btn-secondary cmp-btn-reject" data-cmp-modal="reject">Reject non-essential</button>' +
      "</div>";

    overlayEl.appendChild(modalEl);
    document.body.appendChild(overlayEl);

    overlayEl.addEventListener("click", function (e) {
      if (e.target === overlayEl) closeModal();
    });

    modalEl.querySelector(".cmp-modal-close").addEventListener("click", closeModal);

    modalEl.addEventListener("click", function (e) {
      var action = e.target.getAttribute("data-cmp-modal");
      if (action === "save") saveFromModal("cmp");
      else if (action === "accept-all") acceptAll();
      else if (action === "reject") rejectNonEssential();
    });
  }

  function openModal() {
    syncModalFromState();
    overlayEl.classList.remove("cmp-hidden");
    overlayEl.setAttribute("aria-hidden", "false");
    document.body.classList.add("cmp-modal-open");
  }

  function closeModal() {
    if (!overlayEl) return;
    overlayEl.classList.add("cmp-hidden");
    overlayEl.setAttribute("aria-hidden", "true");
    document.body.classList.remove("cmp-modal-open");
  }

  function showBanner() {
    if (!bannerEl) buildBanner();
    bannerEl.classList.remove("cmp-hidden");
    document.body.classList.add("cmp-banner-visible");
  }

  function hideBanner() {
    if (!bannerEl) return;
    bannerEl.classList.add("cmp-hidden");
    document.body.classList.remove("cmp-banner-visible");
  }

  function injectFooterLink() {
    if (document.getElementById("cmp-footer-settings")) return;

    var link = document.createElement("button");
    link.type = "button";
    link.id = "cmp-footer-settings";
    link.className = "cmp-footer-link";
    link.textContent = "Cookie settings";
    link.addEventListener("click", function (e) {
      e.preventDefault();
      openModal();
    });

    var copyright = document.querySelector(".copyright");
    if (copyright) {
      copyright.appendChild(document.createElement("br"));
      copyright.appendChild(link);
      return;
    }

    var footer = document.querySelector("footer .container");
    if (footer) {
      var wrap = document.createElement("p");
      wrap.className = "cmp-footer-wrap";
      wrap.appendChild(link);
      footer.appendChild(wrap);
      return;
    }

    link.style.cssText =
      "position:fixed;bottom:8px;left:8px;z-index:9998;background:transparent;border:none;color:#3498db;cursor:pointer;font-size:12px;text-decoration:underline;";
    document.body.appendChild(link);
  }

  function init() {
    buildBanner();
    buildModal();
    injectFooterLink();

    if (!window.SurfConsent.hasStoredChoice()) {
      showBanner();
    } else {
      hideBanner();
    }

    window.addEventListener("surf:consent-reset", function () {
      showBanner();
    });

    window.addEventListener("surf:consent-updated", function () {
      syncModalFromState();
    });
  }

  window.SurfCmpMock = {
    showBanner: showBanner,
    hideBanner: hideBanner,
    openModal: openModal,
    closeModal: closeModal,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window);
