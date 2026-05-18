const EventEmitter = require('events');

class StatusEvents extends EventEmitter {
  publish(task) {
    this.emit(task.id, {
      taskId: task.id,
      projectId: task.projectId,
      status: task.status,
      updatedAt: task.updatedAt,
    });
  }
}

module.exports = StatusEvents;
