// backend/models/Website.js
class Website {
    constructor(id, groupId, name, url, order) {
      this.id = id;
      this.groupId = groupId;
      this.name = name;
      this.url = url;
      this.order = order;
    }
  }
  
  module.exports = Website;