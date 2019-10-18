function createJobs (execlib, jobondestroyablelib) {
  'use strict';

  var lib = execlib.lib,
    JobOnDestroyableBase = jobondestroyablelib.JobOnDestroyableBase;

  function JobOnNatClient (client, defer) {
    JobOnDestroyableBase.call(this, client, defer);
  }
  lib.inherit(JobOnNatClient, JobOnDestroyableBase);
  JobOnNatClient.prototype._destroyableOk = function () {
    return this.destroyable && this.destroyable.jobs;
  };


  function NatTask (client, ipaddress, port, defer) {
    JobOnNatClient.call(this, client, defer);
    this.ipaddress = ipaddress;
    this.port = port;
    this.listener = null;
  }
  lib.inherit(NatTask, JobOnNatClient);
  NatTask.prototype.destroy = function () {
    if (this.listener) {
      this.listener.destroy();
    }
    this.listener = null;
    this.port = null;
    this.ipaddress = null;
    JobOnNatClient.prototype.destroy.call(this);
  };
  NatTask.prototype.go = function () {
    var ok = this.okToGo();
    if (!ok.ok) {
      return ok.val;
    }
    if (this.listener) {
      return ok.val;
    }
    this.listener = this.destroyable.state.listenFor('ready', this.onReady.bind(this), true);
    return ok.val;
  };
  NatTask.prototype.onReady = function (ready) {
    if (!ready) {
      return;
    }
    if (!this.okToProceed()) {
      return;
    }
    this.destroyable.data.some(this.onNatRecord.bind(this));
  };
  NatTask.prototype.onNatRecord = function (datahash) {
    var match = this.matches(datahash);
    if (match) {
      this.resolve(this.resultOf(datahash));
    }
    return match;
  };
  NatTask.prototype.matches = function (datahash) {
    //console.log('nat ok?',datahash,this.ipaddress,this.port);
    if (datahash.iaddress !== this.ipaddress) {
      //console.log('nope');
      return false;
    }
    if(lib.isArray(datahash.iport)){
      //console.log(this.port >= datahash.iport[0] && this.port <= datahash.iport[1]);
      return this.port >= datahash.iport[0] && this.port <= datahash.iport[1];
    }
    //console.log(this.port === datahash.iport);
    return this.port === datahash.iport;
  };
  NatTask.prototype.resultOf = function (datahash) {
    var port;
    if (lib.isArray(datahash.iport) && datahash.eport === 0) {
      port = this.port;
    } else {
      port = datahash.eport;
    }
    return {ipaddress:datahash.eaddress, port: port};
  };

  return {
    NatTask: NatTask
  };

}

module.exports = createJobs;
