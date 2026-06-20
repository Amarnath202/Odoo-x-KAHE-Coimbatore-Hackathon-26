export const MESSAGES = {
  // Generic
  SUCCESS: 'Operation successful',
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Insufficient permissions',
  VALIDATION_ERROR: 'Validation failed',
  INTERNAL_ERROR: 'Internal server error',

  // Auth
  AUTH: {
    LOGIN_SUCCESS: 'Login successful',
    LOGOUT_SUCCESS: 'Logout successful',
    INVALID_CREDENTIALS: 'Invalid email or password',
    TOKEN_EXPIRED: 'Access token expired',
    TOKEN_INVALID: 'Invalid token',
    REFRESH_SUCCESS: 'Token refreshed successfully',
    REFRESH_INVALID: 'Invalid or expired refresh token',
    PASSWORD_CHANGED: 'Password changed successfully',
    ACCOUNT_DISABLED: 'Account is disabled. Contact administrator.',
  },

  // Users
  USERS: {
    NOT_FOUND: 'User not found',
    EMAIL_EXISTS: 'Email already in use',
    CREATED: 'User created successfully',
  },

  // Products
  PRODUCTS: {
    NOT_FOUND: 'Product not found',
    SKU_EXISTS: 'SKU already exists for this company',
    CREATED: 'Product created successfully',
  },

  // Inventory
  INVENTORY: {
    INSUFFICIENT: 'Insufficient stock available',
    ADJUSTED: 'Stock adjusted successfully',
    NOT_FOUND: 'Inventory record not found',
  },

  // Sales
  SALES: {
    ORDER_NOT_FOUND: 'Sales order not found',
    ALREADY_CONFIRMED: 'Sales order is already confirmed',
    ALREADY_DELIVERED: 'Sales order is already fully delivered',
    CANCELLED: 'Sales order cancelled',
    CANNOT_CANCEL: 'Cannot cancel a delivered order',
    CONFIRM_SUCCESS: 'Sales order confirmed and stock reserved',
    DELIVER_SUCCESS: 'Delivery recorded successfully',
    CUSTOMER_NOT_FOUND: 'Customer not found',
  },

  // Purchase
  PURCHASE: {
    ORDER_NOT_FOUND: 'Purchase order not found',
    ALREADY_CONFIRMED: 'Purchase order is already confirmed',
    ALREADY_RECEIVED: 'Purchase order is fully received',
    CONFIRM_SUCCESS: 'Purchase order confirmed',
    RECEIVE_SUCCESS: 'Goods received and inventory updated',
    VENDOR_NOT_FOUND: 'Vendor not found',
  },

  // Manufacturing
  MANUFACTURING: {
    ORDER_NOT_FOUND: 'Manufacturing order not found',
    COMPONENT_SHORTAGE: 'Insufficient component stock for manufacturing',
    CONFIRM_SUCCESS: 'Manufacturing order confirmed',
    START_SUCCESS: 'Manufacturing started — components reserved',
    COMPLETE_SUCCESS: 'Manufacturing completed — goods produced',
  },

  // BoM
  BOM: {
    NOT_FOUND: 'Bill of Materials not found',
    NO_COMPONENTS: 'BoM must have at least one component',
  },

  // Procurement
  PROCUREMENT: {
    TRIGGERED: 'Procurement automation triggered',
    PO_CREATED: 'Purchase order auto-generated',
    MO_CREATED: 'Manufacturing order auto-generated',
    NO_VENDOR: 'Product has no vendor configured for auto-procurement',
    NO_BOM: 'Product has no BoM configured for auto-manufacturing',
  },
} as const;
