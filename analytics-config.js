// Set this to the GA4 web stream Measurement ID to enable the Google tag.
const measurementId = 'G-JXNCF1CELC';
if (/^G-[A-Z0-9]+$/.test(measurementId)) {
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  gtag('js', new Date());
  // GTM already owns the automatic page_view. This lightweight direct tag is
  // only here to deliver the named interaction events below without creating
  // a duplicate page view.
  gtag('config', measurementId, { send_page_view: false });
  const tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
  document.head.append(tag);
}
