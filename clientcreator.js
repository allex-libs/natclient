function createClient (execlib, mylib) {
  'use strict';

  var lib = execlib.lib,
    q = lib.q,
    qlib = lib.qlib,
    execSuite = execlib.execSuite,
    taskRegistry = execSuite.taskRegistry,
    jobs = require('./jobs')(execlib);

  function NatClient () {
    this.jobs = new qlib.JobCollection();
    this.data = [];
    this.sink = null;
    this.state = new lib.ListenableMap();
    this.findTask = taskRegistry.run('findNatSink', {
      cb: this.setSink.bind(this)
    });
    this.materializeTask = null;
    this.state.replace('ready', 0);
  }
  NatClient.prototype.destroy = function () {
    if (this.materializeTask) {
      this.materializeTask.destroy();
    }
    this.materializeTask = null;
    if (this.findTask) {
      this.findTask.destroy();
    }
    this.findTask = null;
    if (this.state) {
      this.state.destroy();
    }
    this.state = null;
    if (this.sink) {
      this.sink.destroy();
    }
    this.sink = null;
    this.data = null;
    if (this.jobs) {
      this.jobs.destroy();
    }
    this.jobs = null;
  };
  NatClient.prototype.nat = function (ipaddress, port) {
    return this.jobs.run('.', new jobs.NatTask(this, ipaddress, port));
  };
  NatClient.prototype.setSink = function (sink) {
    var ch;
    this.sink = sink;
    if (!sink) {
      this.state.replace('ready', 0);
      this.data = [];
      if (this.materializeTask) {
        this.materializeTask.destroy();
      }
      this.materializeTask = null;
      return;
    }
    ch = this.onDataChanged.bind(this);
    this.materializeTask = taskRegistry.run('materializeQuery', {
      sink: sink,
      data: this.data,
      continuous: true,
      onInitiated: this.onDataInitiated.bind(this),
      onRecordUpdate: ch,
      onNewRecord: ch
    });
  };
  NatClient.prototype.onDataInitiated = function () {
    this.state.replace('ready', 1);
  };
  NatClient.prototype.onDataChanged = function () {
    this.state.replace('ready', this.state.get('ready')+1);
  };

  mylib.Client = NatClient;
}

module.exports = createClient;
