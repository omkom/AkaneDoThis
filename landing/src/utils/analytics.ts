// src/utils/analytics.ts

// Initialize dataLayer array if it doesn't exist
window.dataLayer = window.dataLayer || [];

// Types for events
interface PageViewEvent {
  event: 'pageview';
  pagePath: string;
  pageTitle: string;
}

interface ClickEvent {
  event: 'click';
  clickType: string;
  clickText: string;
  clickDestination?: string;
}

interface FormSubmitEvent {
  event: 'form_submit';
  formName: string;
  formData?: Record<string, unknown>;
}

// Push data to the dataLayer
function pushToDataLayer(data: unknown): void {
  window.dataLayer.push(data);
}

// Track page views
export function trackPageView(pagePath: string, pageTitle: string): void {
  const pageViewData: PageViewEvent = {
    event: 'pageview',
    pagePath,
    pageTitle
  };
  pushToDataLayer(pageViewData);
}

// Track clicks
export function trackClick(clickType: string, clickText: string, clickDestination?: string): void {
  const clickData: ClickEvent = {
    event: 'click',
    clickType,
    clickText,
    ...(clickDestination && { clickDestination })
  };
  pushToDataLayer(clickData);
}

// Track form submissions
export function trackFormSubmit(formName: string, formData?: Record<string, unknown>): void {
  const formSubmitData: FormSubmitEvent = {
    event: 'form_submit',
    formName,
    ...(formData && { formData })
  };
  pushToDataLayer(formSubmitData);
}

// Add user properties to data layer
export function setUserProperties(properties: Record<string, unknown>): void {
  pushToDataLayer({
    event: 'set_user_properties',
    user_properties: properties
  });
}

// Track custom events
export function trackEvent(eventName: string, eventParams: Record<string, unknown>): void {
  pushToDataLayer({
    event: eventName,
    ...eventParams
  });
}

// Default export of all tracking functions
export default {
  trackPageView,
  trackClick,
  trackFormSubmit,
  setUserProperties,
  trackEvent
};

// Add this to global Window interface
declare global {
  interface Window {
    dataLayer: unknown[];
  }
}