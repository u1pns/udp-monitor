/**
 * MessageFilter - Handles filtering of UDP messages
 */
export class MessageFilter {
  constructor() {
    this.filters = [];
  }

  /**
   * Add a filter pattern (regex)
   * @param {string} pattern - Regular expression pattern
   */
  addFilter(pattern) {
    const regex = new RegExp(pattern, 'i');
    this.filters.push({ pattern, regex });
  }

  /**
   * Clear all filters
   */
  clearFilters() {
    this.filters = [];
  }

  /**
   * Get list of active filter patterns
   * @returns {string[]} Array of filter patterns
   */
  getFilters() {
    return this.filters.map(f => f.pattern);
  }

  /**
   * Check if message matches filters
   * @param {string} message - Message content
   * @param {object} rinfo - Remote info (address, port)
   * @returns {boolean} True if message should be displayed
   */
  match(message, rinfo) {
    // If no filters, show all messages
    if (this.filters.length === 0) {
      return true;
    }

    // Check if message matches any filter
    const source = `${rinfo.address}:${rinfo.port}`;
    const searchText = `${message} ${source}`;
    
    return this.filters.some(filter => filter.regex.test(searchText));
  }
}
