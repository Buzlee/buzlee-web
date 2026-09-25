/**
 * QR check-in landing for people without the app. Business QR codes encode
 * `/flyer/<id>/checkin?event=<flyerEventId>` (buzlee-app `getFlyerCheckinUrl`);
 * the app handles the link when installed, otherwise it lands here. The flyer
 * share page is rendered at this path, rather than redirected to, so PostHog
 * can tell QR scans from share links. Metadata (canonical `/flyer/<id>`,
 * noindex), data caching and the `?event=` handoff are the parent page's.
 */
export { default, generateMetadata } from "../page";
