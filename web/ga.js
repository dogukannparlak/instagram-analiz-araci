/* GA4 yükleyici: <meta name="ga-id" content="G-..."> boşsa ya da G-XXXXXXXXXX yer tutucusuysa hiçbir şey yapmaz.
   DNT / GPC / webdriver açıksa da yüklenmez. */
(function () {
  var m = document.querySelector('meta[name="ga-id"]');
  var id = m && (m.getAttribute("content") || "").trim();
  if (!/^G-[A-Z0-9]{6,}$/.test(id || "") || id === "G-XXXXXXXXXX") return;
  var n = navigator;
  if (n.doNotTrack === "1" || window.doNotTrack === "1" || n.globalPrivacyControl || n.webdriver) return;
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", id, { anonymize_ip: true });
  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
  document.head.appendChild(s);
})();
