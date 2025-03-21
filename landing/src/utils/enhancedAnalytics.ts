// src/utils/enhancedAnalytics.ts
import { trackEvent } from './analytics';

/**
 * Enhanced analytics tracking for e-commerce functionality
 */

// Track product impressions
export function trackProductImpression(
  productId: string,
  name: string,
  category: string,
  position: number,
  price?: number,
  brand?: string,
  variant?: string
) {
  trackEvent('view_item_list', {
    item_list: {
      items: [
        {
          item_id: productId,
          item_name: name,
          item_category: category,
          item_brand: brand,
          item_variant: variant,
          price: price,
          index: position
        }
      ]
    }
  });
}

// Track product click
export function trackProductClick(
  productId: string,
  name: string,
  category: string,
  position: number,
  price?: number,
  brand?: string,
  variant?: string
) {
  trackEvent('select_item', {
    item: {
      item_id: productId,
      item_name: name,
      item_category: category,
      item_brand: brand,
      item_variant: variant,
      price: price,
      index: position
    }
  });
}

// Track product detail view
export function trackProductDetail(
  productId: string,
  name: string,
  category: string,
  price?: number,
  brand?: string,
  variant?: string
) {
  trackEvent('view_item', {
    items: [
      {
        item_id: productId,
        item_name: name,
        item_category: category,
        item_brand: brand,
        item_variant: variant,
        price: price
      }
    ]
  });
}

// Track add to cart
export function trackAddToCart(
  productId: string,
  name: string,
  category: string,
  quantity: number,
  price?: number,
  brand?: string,
  variant?: string
) {
  trackEvent('add_to_cart', {
    items: [
      {
        item_id: productId,
        item_name: name,
        item_category: category,
        item_brand: brand,
        item_variant: variant,
        price: price,
        quantity: quantity
      }
    ]
  });
}

// Track checkout process
export function trackBeginCheckout(cartItems: unknown[], coupon?: string) {
  trackEvent('begin_checkout', {
    items: cartItems,
    coupon: coupon
  });
}

// Track purchase completion
export function trackPurchase(
  transactionId: string,
  value: number,
  tax?: number,
  shipping?: number,
  coupon?: string,
  items?: unknown[]
) {
  trackEvent('purchase', {
    transaction_id: transactionId,
    value: value,
    tax: tax,
    shipping: shipping,
    coupon: coupon,
    items: items
  });
}

/**
 * Enhanced user engagement tracking
 */

// Track video engagement
export function trackVideoEngagement(
  videoId: string,
  title: string,
  provider: string,
  currentTime: number,
  duration: number,
  percent: number,
  action: 'start' | 'progress' | 'complete'
) {
  trackEvent('video_engagement', {
    video_id: videoId,
    video_title: title,
    video_provider: provider,
    current_time: currentTime,
    duration: duration,
    percent: percent,
    action: action
  });
}

// Track streaming session
export function trackStreamEngagement(
  streamTitle: string,
  streamerId: string,
  streamPlatform: string,
  watchDuration: number,
  interactionCount: number
) {
  trackEvent('stream_engagement', {
    stream_title: streamTitle,
    streamer_id: streamerId,
    platform: streamPlatform,
    watch_duration: watchDuration,
    interactions: interactionCount
  });
}

// Track content sharing
export function trackShare(
  contentType: string,
  contentId: string,
  method: string
) {
  trackEvent('share', {
    content_type: contentType,
    item_id: contentId,
    method: method
  });
}

// Track user signup or login
export function trackUserAuthentication(
  method: 'signup' | 'login',
  userId: string,
  userType: string
) {
  trackEvent(method === 'signup' ? 'sign_up' : 'login', {
    method: method,
    user_id: userId,
    user_type: userType
  });
}

// Track subscription actions
export function trackSubscription(
  subscriptionId: string,
  plan: string,
  value: number,
  term: string,
  action: 'start' | 'renew' | 'upgrade' | 'downgrade' | 'cancel'
) {
  trackEvent('subscription', {
    subscription_id: subscriptionId,
    subscription_plan: plan,
    value: value,
    term: term,
    action: action
  });
}

// Track outbound link clicks
export function trackOutboundLink(
  url: string,
  linkText: string,
  category: string
) {
  trackEvent('outbound_link', {
    destination_url: url, 
    link_text: linkText,
    link_category: category
  });
}

// Track file downloads
export function trackDownload(
  fileUrl: string,
  fileName: string,
  fileType: string,
  fileSize?: number
) {
  trackEvent('file_download', {
    file_url: fileUrl,
    file_name: fileName,
    file_type: fileType,
    file_size: fileSize
  });
}

export default {
  trackProductImpression,
  trackProductClick,
  trackProductDetail,
  trackAddToCart,
  trackBeginCheckout,
  trackPurchase,
  trackVideoEngagement,
  trackStreamEngagement,
  trackShare,
  trackUserAuthentication,
  trackSubscription,
  trackOutboundLink,
  trackDownload
};