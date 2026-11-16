// Set this to the GA4 web stream Measurement ID to enable the Google tag.
const measurementId = '';
if (/^G-[A-Z0-9]+$/.test(measurementId)) {
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  gtag('js', new Date());
  gtag('config', measurementId);
  const tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
  document.head.append(tag);
}
