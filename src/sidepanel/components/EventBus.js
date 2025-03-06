// 简单的事件总线实现
export default class EventBus {
  static events = {};

  static subscribe(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
  }

  static publish(eventName, data) {
    if (!this.events[eventName]) return;
    this.events[eventName].forEach(callback => callback(data));
  }
}