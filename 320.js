/**
 * Created by iv on 2/12/14.
 */

$(document).ready(function(){

  $(".state").hover(
    function() { $(this).stop().animate({width: '160px', height: '120px'}, 200).css({'z-index' : '10'}); },
    function() { $(this).stop().animate({width: '10px', height: '14px'}, 200).css({'z-index' : '1'}); }
  ).click(
    function() { $(this).stop().animate({width: '10px', height: '14px'}, 50).css({'z-index' : '1'}); }
  );

//  $('body').keydown(function(event){
//    event.which==32 ? alert("pause") : void 0;
//  });

//  $('#rv5png').click(function(){
//    $(this).attr('src',function(){
//      return /red/.test(this.src) ? "black.png" : (/black/.test(this.src) ? "cros.png" : (/cros/.test(this.src) ? "green.png" : "red.png"));
//    });
//  });

});

/*var PauseCheck = Backbone.View.extend({

  events: {
    'keydown': 'checkForSpaceKey'
  },

  checkForSpaceKey: function(event) {
    event.which == 32 ? alert("pause") : void 0;
  }
});

var pauseCheck = new PauseCheck({ el: 'body'});*/

var State = Backbone.View.extend({
  events: {
    "click": "changeStateManual"
  },

  elName: '',

  begin: false,
  end: false,
  in: {},
  out: [],
  neighbors: [],

  changedManual: 'off',
  enabledElectric: false,
  enabledMechanic: false,

  zKontakts: [],
  rKontakts: [],
  waitTime: false,
  secondCall: false,
  disableCalls: 0,

  changeStateManual: function() {
    switch (this.changedManual) {
      case "off":
        this.changedManual = "black";
        break;
      case "black":
        this.changedManual = "cros";
        break;
      case "cros":
        this.changedManual = "off";
        break;
    }

    this.changeColor();
    delete this.in['manual'];
    this.reset('manual',[]);
  },

  start: function() {
    var neighbors = this.neighbors;

    if (this.begin == true) {
      this.enabledElectric = true;

      if (!this.end) {
        this.out = this.isEnabled() ? [[this.elName]] : [];
        for (var i = 0, l = neighbors.length; i < l; i++) {
          neighbors[i].reset(this.elName, this.out);
        }
      }

    }

    this.changeColor();
  },

  reset: function(inElement, inChains) {

    if (this.begin == true) {
      this.start();
      return ;
    }

    var self = this;
    var neighbors = this.neighbors;
    var clearChains = [];
    var outChains = [];

    _.each(inChains, function(chain){
      if (_.indexOf(chain, self.elName) < 0) { clearChains.push(chain); }
    });

    if (this.checkElectric(clearChains)) { this.enabledElectric = true; }

    if (this.in[inElement] && (this.in[inElement].length == clearChains.length)) {
      return 'not changed';
    } else {
      this.in[inElement] = clearChains;
    }

    if (this.isEnabled()) {
      _.each(this.in, function(inChains){
        _.each(inChains, function(inChain){
          var outChain = _.clone(inChain);
          outChain.push(self.elName);
          outChains.push(outChain);
        });
      });
      if (!self.checkElectric(outChains)) { self.enabledElectric = false; }
    } else { outChains = []; }

    this.changeColor();
    if (this.end) {
      this.switchMechanic();
      return 'end';
    }

    for (var i = 0, l = neighbors.length; i < l; i++) {
      neighbors[i].reset(this.elName, outChains);
    }
  },

  checkElectric: function(chains) {
    var res, electro;

    electro = _.flatten(chains);
    electro = _.compact(electro);
    if (electro.length > 0) {
      res = true;
    } else { res = false; }

    return res;
  },

  changeColor: function() {

    var manual = this.changedManual;
    var color = '';

    if (manual == 'cros') {
      color = 'cros';
    } else if (manual == 'black') {
      color = 'black';
    } else {
      color = this.isEnabled() ? 'green' : 'red';
    }


    this.$el.attr('src', "states/" + color + ".png");

  },

  isEnabled: function(){

    var manual = this.changedManual;
    var electric = this.enabledElectric;
    var mechanic = this.enabledMechanic;

    if (manual == 'cros' || !electric) {
      return false;
    } else if (!mechanic && (manual == 'off')) {
      return false;
    } else { return true; }
  },

  switchMechanic: function() {

    var self = this;
    var zSec = 150, rSec = 200;
    var enableMech = false;

    var electric = this.enabledElectric;
    var manual = this.changedManual;
    var wait = this.waitTime;

    if (manual == "black" || (electric && manual != "cros")) {
      zSec = 200;
      rSec = 150;
      enableMech = true;
    }

    if (enableMech) { this.secondCall = false; }
    if (this.changedManual == "cros") { this.secondCall = true; }

    if (wait && !enableMech && !this.secondCall) {
      var switchMechanic = _.bind(this.switchMechanic, this);
      this.secondCall = true;
      self.disableCalls += 1;
      return  _.delay(function() {
        if (self.disableCalls > 1) {
          self.disableCalls -= 1;
          return 'est escho';
        } else {
          self.disableCalls -= 1;
          switchMechanic();
        }
      }, wait, self);
    }

    _.each(self.zKontakts, function(zKontakt){
      _.delay(function() {
        zKontakt.enabledMechanic = enableMech;
        delete zKontakt.in['mechanic'];
        zKontakt.reset('mechanic', []);
      }, zSec, zKontakt, enableMech);
    });

    _.each(self.rKontakts, function(rKontakt){
      _.delay(function() {
        rKontakt.enabledMechanic = !enableMech;
        delete rKontakt.in['mechanic'];
        rKontakt.reset('mechanic', []);
      }, rSec, rKontakt, enableMech);
    });
  }

});

var rtoz1 = new State({ el: '#rtoz1png'}); // цепочка рв5
var rdz1  = new State({ el: '#rdz1png'});
var rodz1 = new State({ el: '#rodz1png'});
var rzdz1 = new State({ el: '#rzdz1png'});
var vr24z = new State({ el: '#vr2-4zpng'});
var rv5   = new State({ el: '#rv5png'});

var rv2z1 = new State({ el: '#rv2z1png'}); // цепочка освещения
var dkz   = new State({ el: '#dkzpng'});
var l1    = new State({ el: '#l1png'});

var rv5z1 = new State({ el: '#rv5z1png'}); // цепочка рв2
var rv2   = new State({ el: '#rv2png'});

var rdr1  = new State({ el: '#rdr1png'}); // цепочка рп
var rv5z2 = new State({ el: '#rv5z2png'});
var rpz1  = new State({ el: '#rpz1png'});
var rzdz2 = new State({ el: '#rzdz2png'});
var rp    = new State({ el: '#rppng'});

var rdz2    = new State({ el: '#rdz2png'}); // цепочка закрытия дверей
var f12rez1 = new State({ el: '#f12rez1png'});
var f6rez1  = new State({ el: '#f6rez1png'});
var f1rez1  = new State({ el: '#f1rez1png'});
var rv2r1   = new State({ el: '#rv2r1png'});
var rzdz3   = new State({ el: '#rzdz3png'});
var rodr1   = new State({ el: '#rodr1png'});
var r7      = new State({ el: '#r7png'});
var vkzz    = new State({ el: '#vkzzpng'});
var vbrr    = new State({ el: '#vbrrpng'});
var rzd     = new State({ el: '#rzdpng'});

var mknstopr = new State({ el: '#mknstoprpng'}); // цепочка безопасности
var vkr      = new State({ el: '#vkrpng'});
var vnur     = new State({ el: '#vnurpng'});
var v2r      = new State({ el: '#v2rpng'});
var knstopr  = new State({ el: '#knstoprpng'});
var vlr      = new State({ el: '#vlrpng'});
var spkr     = new State({ el: '#spkrpng'});
var dkr      = new State({ el: '#dkrpng'});
var f1dshr   = new State({ el: '#f1dshrpng'});
var f12dshr  = new State({ el: '#f12dshrpng'});

var dchtor   = new State({ el: '#dchtorpng'}); // цепочка точной остановки
var rto      = new State({ el: '#rtopng'});

var rdr2  = new State({ el: '#rdr2png'}); // цепочка открытия дверей
var rtor1 = new State({ el: '#rtor1png'});
var vr23r = new State({ el: '#vr2-3rpng'});
var rv5z3 = new State({ el: '#rv5z3png'});
var rpr1  = new State({ el: '#rpr1png'});
var vkor  = new State({ el: '#vkorpng'});
var rzdr1 = new State({ el: '#rzdr1png'});
var vbrz  = new State({ el: '#vbrzpng'});
var rodz2 = new State({ el: '#rodz2png'});
var rod   = new State({ el: '#rodpng'});

var rpz2     = new State({ el: '#rpz2png'});// цепочка отправки, вызова и повтора
var rodr2    = new State({ el: '#rodr2png'});
var rkdz1    = new State({ el: '#rkdz1png'});
var rkdr1    = new State({ el: '#rkdr1png'});
var rtor2    = new State({ el: '#rtor2png'});
var rpr2     = new State({ el: '#rpr2png'});
var rv5r1    = new State({ el: '#rv5r1png'});
var kbrr     = new State({ el: '#kbrrpng'});
var rdr4     = new State({ el: '#rdr4png'});
var vr21r    = new State({ el: '#vr2-1rpng'});
var rkdz2    = new State({ el: '#rkdz2png'});
var rv2r2    = new State({ el: '#rv2r2png'});
var f12knpz  = new State({ el: '#f12knpzpng'});
var f12knz   = new State({ el: '#f12knzpng'});
var f12rez2  = new State({ el: '#f12rez2png'});
var f12ep4z  = new State({ el: '#f12ep-4zpng'});
var f12re    = new State({ el: '#f12repng'});
var f6knpz   = new State({ el: '#f6knpzpng'});
var f6knz    = new State({ el: '#f6knzpng'});
var f6rez2   = new State({ el: '#f6rez2png'});
var f6ep3r4z = new State({ el: '#f6ep-3r6ep-4zpng'});
var f6re     = new State({ el: '#f6repng'});
var f1knpz   = new State({ el: '#f1knpzpng'});
var f1knz    = new State({ el: '#f1knzpng'});
var f1rez2   = new State({ el: '#f1rez2png'});
var f1ep3r   = new State({ el: '#f1ep-3rpng'});
var f1re     = new State({ el: '#f1repng'});

var vr22z     = new State({ el: '#vr2-2zpng'}); // цепочка управления из машинного помещения
var kmr1      = new State({ el: '#kmr1png'});
var rdr3      = new State({ el: '#rdr3png'});
var mknvverhz = new State({ el: '#mknvverhzpng'});
var mknvnizz  = new State({ el: '#mknvnizzpng'});

var rodr3 = new State({ el: '#rodr3png'}); // цепочка большой скорости
var kbz1  = new State({ el: '#kbz1png'});
var kb    = new State({ el: '#kbpng'});

var f12rez3 = new State({ el: '#f12rez3png'}); // цепочка этажников
var f6rez3  = new State({ el: '#f6rez3png'});
var f1rez3  = new State({ el: '#f1rez3png'});
var f12ep2r = new State({ el: '#f12ep-2rpng'});
var f6ep2r  = new State({ el: '#f6ep-2rpng'});
var f6ep1z  = new State({ el: '#f6ep-1zpng'});
var f1ep1z  = new State({ el: '#f1ep-1zpng'});

var kmz1      = new State({ el: '#kmz1png'}); // цепочка ревизии
var kknvverhz = new State({ el: '#kknvverhzpng'});
var kknvnizz  = new State({ el: '#kknvnizzpng'});

var knr1 = new State({ el: '#knr1png'}); // цепочка верха/низа
var kvr1 = new State({ el: '#kvr1png'});
var kv   = new State({ el: '#kvpng'});
var kn   = new State({ el: '#knpng'});

var rkdz3 = new State({ el: '#rkdz3png'});  //цепочка поддержки направления
var kbz2  = new State({ el: '#kbz2png'});
var kvz1  = new State({ el: '#kvz1png'});
var knz1  = new State({ el: '#knz1png'});
var kmz2  = new State({ el: '#kmz2png'});
var rpz3  = new State({ el: '#rpz3png'});
var rtoz2 = new State({ el: '#rtoz2png'});
var rtoz3 = new State({ el: '#rtoz3png'});

var rzdr2 = new State({ el: '#rzdr2png'}); // цепочка  ркд
var rkd   = new State({ el: '#rkdpng'});

var rkdr2 = new State({ el: '#rkdr2png'}); // цепочка малой
var rkdz4 = new State({ el: '#rkdz4png'});
var kbr1  = new State({ el: '#kbr1png'});
var km    = new State({ el: '#kmpng'});

var kvz2  = new State({ el: '#kvz2png'}); // цепочка движения
var knz2  = new State({ el: '#knz2png'});
var rd    = new State({ el: '#rdpng'});

var rzdz4 = new State({ el: '#rzdz4png'}); // цепочка двигателя дверей
var rzdz5 = new State({ el: '#rzdz5png'});
var rodz3 = new State({ el: '#rodz3png'});
var rodz4 = new State({ el: '#rodz4png'});

var knz3 = new State({ el: '#knz3png'}); // цепочка двигателя кабины
var knz4 = new State({ el: '#knz4png'});
var kvz3 = new State({ el: '#kvz3png'});
var kvz4 = new State({ el: '#kvz4png'});
var kbz3 = new State({ el: '#kbz3png'});
var kbz4 = new State({ el: '#kbz4png'});
var kmz3 = new State({ el: '#kmz3png'});
var kmz4 = new State({ el: '#kmz4png'});
var rdz3 = new State({ el: '#rdz3png'});
var emt  = new State({ el: '#emtpng'});

// цепочка рв5
_.extend(rtoz1, {
  elName: "rtoz1",
  neighbors: [rv5],
  begin: true
});
_.extend(rdz1,  {
  elName: "rdz1",
  neighbors: [rv5],
  begin: true
});
_.extend(rodz1, {
  elName: "rodz1",
  neighbors: [rv5],
  begin: true
});
_.extend(rzdz1, {
  elName: "rzdz1",
  neighbors: [rv5],
  begin: true
});
_.extend(vr24z, {
  elName: "vr24z",
  neighbors: [rv5],
  begin: true
});
_.extend(rv5,   {
  elName: "rv5",
  neighbors: [],
  enabledMechanic: true,
  end: true,
  in: {},
  waitTime: 3500,
  zKontakts: [rv5z1, rv5z2, rv5z3],
  rKontakts: [rv5r1]
});

// цепочка освещения
_.extend(rv2z1, {
  elName: "rv2z1",
  neighbors: [l1],
  begin: true
});
_.extend(dkz,   {
  elName: "dkz",
  neighbors: [l1],
  begin: true
});
_.extend(l1,    {
  elName: "l1",
  neighbors: [],
  enabledMechanic: true,
  end: true,
  in: {}
});

// цепочка рв2
_.extend(rv5z1, {
  elName: "rv5z1",
  neighbors: [rv2],
  begin: true
});
_.extend(rv2,   {
  elName: "rv2",
  neighbors: [],
  enabledMechanic: true,
  end: true,
  in: {},
  waitTime: 3500,
  zKontakts: [rv2z1],
  rKontakts: [rv2r1, rv2r2]
});

// цепочка рп
_.extend(rdr1,  {
  elName: "rdr1",
  neighbors: [rv5z2, rzdz2],
  begin: true,
  enabledMechanic: true
});
_.extend(rv5z2, {
  elName: "rv5z2",
  neighbors: [rpz1],
  in: {}
});
_.extend(rpz1,  {
  elName: "rpz1",
  neighbors: [rv5z2, rzdz2, rp, rdz2],
  in: {}
});
_.extend(rzdz2, {
  elName: "rzdz2",
  neighbors: [rpz1, rp, rdz2],
  in: {}
});
_.extend(rp,    {
  elName: "rp",
  neighbors: [],
  enabledMechanic: true,
  end: true,
  in: {},
  waitTime: 700,
  zKontakts: [rpz1, rpz2, rpz3],
  rKontakts: [rpr1, rpr2]
});

// цепочка закрытия дверей
_.extend(rdz2,    {
  elName: "rdz2",
  neighbors: [rzdz2, rp, rpz1, rodr1],
  in: {}
});
_.extend(f12rez1, {
  elName: "f12rez1",
  neighbors: [rdz2, rodr1],
  begin: true
});
_.extend(f6rez1,  {
  elName: "f6rez1",
  neighbors: [rdz2, rodr1],
  begin: true
});
_.extend(f1rez1,  {
  elName: "f1rez1",
  neighbors: [rdz2, rodr1],
  begin: true
});
_.extend(rv2r1,   {
  elName: "rv2r1",
  neighbors: [rdz2, rodr1],
  enabledMechanic: true,
  begin: true
});
_.extend(rzdz3,   {
  elName: "rzdz3",
  neighbors: [rdz2, rodr1],
  begin: true
});
_.extend(rodr1,   {
  elName: "rodr1",
  neighbors: [r7],
  enabledMechanic: true,
  in: {}
});
_.extend(r7,      {
  elName: "r7",
  neighbors: [vkzz],
  enabledMechanic: true,
  in: {}
});
_.extend(vkzz,    {
  elName: "vkzz",
  neighbors: [vbrr],
  in: {}
});
_.extend(vbrr,    {
  elName: "vbrr",
  neighbors: [rzd],
  enabledMechanic: true,
  in: {}
});
_.extend(rzd,     {
  elName: "rzd",
  neighbors: [],
  enabledMechanic: true,
  end: true,
  in: {},
  waitTime: 50, // уравнены задержки контактов
  zKontakts: [rzdz1, rzdz2, rzdz3, rzdz4, rzdz5],
  rKontakts: [rzdr1, rzdr2]
});

// цепочка безопасности
_.extend(mknstopr, {
  elName: "mknstopr",
  neighbors: [vkr],
  enabledMechanic: true,
  begin: true
});
_.extend(vkr,      {
  elName: "vkr",
  neighbors: [vnur],
  enabledMechanic: true,
  in: {}
});
_.extend(vnur,     {
  elName: "vnur",
  neighbors: [v2r],
  enabledMechanic: true,
  in: {}
});
_.extend(v2r,      {
  elName: "v2r",
  neighbors: [knstopr, dchtor],
  enabledMechanic: true,
  in: {}
});
_.extend(knstopr,  {
  elName: "knstopr",
  neighbors: [vlr],
  enabledMechanic: true,
  in: {}
});
_.extend(vlr,      {
  elName: "vlr",
  neighbors: [spkr],
  enabledMechanic: true,
  in: {}
});
_.extend(spkr,     {
  elName: "spkr",
  neighbors: [dkr, rdr2],
  enabledMechanic: true,
  in: {}
});
_.extend(dkr,      {
  elName: "dkr",
  neighbors: [f1dshr],
  enabledMechanic: true,
  in: {}
});
_.extend(f1dshr,   {
  elName: "f1dshr",
  neighbors: [f12dshr],
  enabledMechanic: true,
  in: {}
});
_.extend(f12dshr,  {
  elName: "f12dshr",
  neighbors: [kbrr, vr22z, kvz2, knz2],
  enabledMechanic: true,
  in: {}
});

// цепочка точной остановки
_.extend(dchtor, {
  elName: "dchtor",
  neighbors: [rto],
  in: {}
});
_.extend(rto,    {
  elName: "rto",
  neighbors: [],
  enabledMechanic: true,
  end: true,
  in: {},
  waitTime: 50, // уравнены задержки контактов
  zKontakts: [rtoz1, rtoz2, rtoz3],
  rKontakts: [rtor1, rtor2]
});

// цепочка открытия дверей
_.extend(rdr2,  {
  elName: "rdr2",
  neighbors: [rtor1],
  enabledMechanic: true,
  in: {}
});
_.extend(rtor1, {
  elName: "rtor1",
  neighbors: [vr23r],
  enabledMechanic: true,
  in: {}
});
_.extend(vr23r, {
  elName: "vr23r",
  neighbors: [rv5z3, rodz2, vbrz, rpz2, rkdr1],
  enabledMechanic: true,
  in: {}
});
_.extend(rv5z3, {
  elName: "rv5z3",
  neighbors: [rpr1],
  in: {}
});
_.extend(rpr1,  {
  elName: "rpr1",
  neighbors: [vkor],
  enabledMechanic: true,
  in: {}
});
_.extend(vkor,  {
  elName: "vkor",
  neighbors: [rzdr1],
  enabledMechanic: true,
  in: {}
});
_.extend(rzdr1, {
  elName: "rzdr1",
  neighbors: [rod],
  enabledMechanic: true,
  in: {}
});
_.extend(vbrz,  {
  elName: "vbrz",
  neighbors: [vkor],
  in: {}
});
_.extend(rodz2, {
  elName: "rodz2",
  neighbors: [vkor],
  in: {}
});
_.extend(rod,   {
  elName: "rod",
  neighbors: [],
  enabledMechanic: true,
  end: true,
  in: {},
  waitTime: 50, // уравнены задержки контактов
  zKontakts: [rodz1, rodz2, rodz3, rodz4],
  rKontakts: [rodr1, rodr2, rodr3]
});

// цепочка отправки, вызова и повтора
_.extend(rpz2,  {
  elName: "rpz2",
  neighbors: [rodr2],
  in: {}
});
_.extend(rodr2, {
  elName: "rodr2",
  neighbors: [rkdz1, f12rez2, f6rez2, f1rez2],
  enabledMechanic: true,
  in: {}
});
_.extend(rkdz1, {
  elName: "rkdz1",
  neighbors: [kbz1, rodr3, f12rez2, f6rez2, f1rez2],
  in: {}
});
_.extend(rkdr1, {
  elName: "rkdr1",
  neighbors: [f12knpz, f6knpz, f1knpz],
  enabledMechanic: true,
  in: {}
});
_.extend(rtor2, {
  elName: "rtor2",
  neighbors: [vkor],
  enabledMechanic: true,
  in: {}
});
_.extend(rpr2,  {
  elName: "rpr2",
  neighbors: [rtor2],
  enabledMechanic: true,
  in: {}
});
_.extend(rv5r1, {
  elName: "rv5r1",
  neighbors: [rpr2],
  enabledMechanic: true,
  in: {}
});
_.extend(kbrr,  {
  elName: "kbrr",
  neighbors: [rdr4, rkdz3, rzdr2],
  enabledMechanic: true,
  in: {}
});
_.extend(rdr4,  {
  elName: "rdr4",
  neighbors: [vr21r],
  enabledMechanic: true,
  in: {}
});
_.extend(vr21r, {
  elName: "vr21r",
  neighbors: [rkdz2, rv2r2],
  enabledMechanic: true,
  in: {}
});
_.extend(rkdz2, {
  elName: "rkdz2",
  neighbors: [f12knpz, f6knpz, f1knpz],
  in: {}
});
_.extend(rv2r2, {
  elName: "rv2r2",
  neighbors: [f12knz, f6knz, f1knz],
  enabledMechanic: true,
  in: {}
});
_.extend(f12knpz, {
  elName: "f12knpz",
  neighbors: [f12re, f12ep4z, f12rez2],
  in: {}
});
_.extend(f12knz, {
  elName: "f12knz",
  neighbors: [f12re, f12ep4z, f12rez2],
  in: {}
});
_.extend(f12rez2, {
  elName: "f12rez2",
  neighbors: [f12re, f12ep4z, rkdz1],
  in: {}
});
_.extend(f12ep4z, {
  elName: "f12ep4z",
  neighbors: [rv5r1],
  in: {}
});
_.extend(f6knpz, {
  elName: "f6knpz",
  neighbors: [f6re, f6ep3r4z, f6rez2],
  in: {}
});
_.extend(f6knz, {
  elName: "f6knz",
  neighbors: [f6re, f6ep3r4z, f6rez2],
  in: {}
});
_.extend(f6rez2, {
  elName: "f6rez2",
  neighbors: [f6re, f6ep3r4z, rkdz1],
  in: {}
});
_.extend(f6ep3r4z, {
  elName: "f6ep3r4z",
  neighbors: [rv5r1],
  in: {}
});
_.extend(f1knpz, {
  elName: "f1knpz",
  neighbors: [f1re, f1ep3r, f1rez2],
  in: {}
});
_.extend(f1knz, {
  elName: "f1knz",
  neighbors: [f1re, f1ep3r, f1rez2],
  in: {}
});
_.extend(f1rez2, {
  elName: "f1rez2",
  neighbors: [f1re, f1ep3r, rkdz1],
  in: {}
});
_.extend(f1ep3r, {
  elName: "f1ep3r",
  neighbors: [rv5r1],
  enabledMechanic: true,
  in: {}
});
_.extend(f12re, {
  elName: "f12re",
  neighbors: [],
  enabledMechanic: true,
  end: true,
  in: {},
  waitTime: 50, // уравнены задержки контактов
  zKontakts: [f12rez1, f12rez2, f12rez3],
  rKontakts: []
});
_.extend(f6re, {
  elName: "f6re",
  neighbors: [],
  enabledMechanic: true,
  end: true,
  in: {},
  waitTime: 50, // уравнены задержки контактов
  zKontakts: [f6rez1, f6rez2, f6rez3],
  rKontakts: []
});
_.extend(f1re, {
  elName: "f1re",
  neighbors: [],
  enabledMechanic: true,
  end: true,
  in: {},
  waitTime: 50, // уравнены задержки контактов
  zKontakts: [f1rez1, f1rez2, f1rez3],
  rKontakts: []
});

// цепочка управления из машинного помещения
_.extend(vr22z, {
  elName: "vr22z",
  neighbors: [kmr1, kmz1, rkdr2],
  in: {}
});
_.extend(kmr1, {
  elName: "kmr1",
  neighbors: [rdr3],
  enabledMechanic: true,
  in: {}
});
_.extend(rdr3, {
  elName: "rdr3",
  neighbors: [mknvverhz, mknvnizz],
  enabledMechanic: true,
  in: {}
});
_.extend(mknvverhz, {
  elName: "mknvverhz",
  neighbors: [f12re, f12rez2],
  in: {}
});
_.extend(mknvnizz, {
  elName: "mknvnizz",
  neighbors: [f1re, f1rez2],
  in: {}
});

// цепочка большой скорости
_.extend(rodr3, {
  elName: "rodr3",
  neighbors: [kb],
  enabledMechanic: true,
  in: {}
});
_.extend(kbz1, {
  elName: "kbz1",
  neighbors: [rkdz1, rodr3, f12rez3, f6rez3, f1rez3],
  in: {}
});
_.extend(kb, {
  elName: "kb",
  neighbors: [],
  enabledMechanic: true,
  end: true,
  in: {},
  waitTime: 50, // уравнены задержки контактов
  zKontakts: [kbz1, kbz2, kbz3, kbz4],
  rKontakts: [kbr1]
});

// цепочка этажников
_.extend(f12rez3, {
  elName: "f12rez3",
  neighbors: [kbz1, f12ep2r],
  in: {}
});
_.extend(f6rez3, {
  elName: "f6rez3",
  neighbors: [kbz1, f6ep2r, f6ep1z],
  in: {}
});
_.extend(f1rez3, {
  elName: "f1rez3",
  neighbors: [kbz1, f1ep1z],
  in: {}
});
_.extend(f12ep2r, {
  elName: "f12ep2r",
  neighbors: [f12rez3, f6ep2r, knr1],
  enabledMechanic: true,
  in: {}
});
_.extend(f6ep2r, {
  elName: "f6ep2r",
  neighbors: [f6rez3, f12ep2r],
  enabledMechanic: true,
  in: {}
});
_.extend(f6ep1z, {
  elName: "f6ep1z",
  neighbors: [f6rez3, f1ep1z],
  in: {}
});
_.extend(f1ep1z, {
  elName: "f1ep1z",
  neighbors: [f1rez3, f6ep1z, kvr1],
  in: {}
});

// цепочка ревизии
_.extend(kmz1, {
  elName: "kmz1",
  neighbors: [kknvverhz, kknvnizz],
  in: {}
});
_.extend(kknvverhz, {
  elName: "kknvverhz",
  neighbors: [f12ep2r],
  in: {}
});
_.extend(kknvnizz, {
  elName: "kknvnizz",
  neighbors: [f1ep1z],
  in: {}
});

// цепочка верха/низа
_.extend(knr1, {
  elName: "knr1",
  neighbors: [kv],
  enabledMechanic: true,
  in: {}
});
_.extend(kvr1, {
  elName: "kvr1",
  neighbors: [kn],
  enabledMechanic: true,
  in: {}
});
_.extend(kv, {
  elName: "kv",
  neighbors: [],
  enabledMechanic: true,
  end: true,
  in: {},
  waitTime: 50, // уравнены задержки контактов
  zKontakts: [kvz1, kvz2, kvz3, kvz4],
  rKontakts: [kvr1]
});
_.extend(kn, {
  elName: "kn",
  neighbors: [],
  enabledMechanic: true,
  end: true,
  in: {},
  waitTime: 50, // уравнены задержки контактов
  zKontakts: [knz1, knz2, knz3, knz4],
  rKontakts: [knr1]
});

//цепочка поддержки направления
_.extend(rkdz3, {
  elName: "rkdz3",
  neighbors: [kbz2, kmz2, rpz3],
  in: {}
});
_.extend(kbz2, {
  elName: "kbz2",
  neighbors: [kvz1, knz1],
  in: {}
});
_.extend(kvz1, {
  elName: "kvz1",
  neighbors: [knr1, f12ep2r],
  in: {}
});
_.extend(knz1, {
  elName: "knz1",
  neighbors: [kvr1, f1ep1z],
  in: {}
});
_.extend(kmz2, {
  elName: "kmz2",
  neighbors: [rtoz2],
  in: {}
});
_.extend(rpz3, {
  elName: "rpz3",
  neighbors: [rtoz2],
  in: {}
});
_.extend(rtoz2, {
  elName: "rtoz2",
  neighbors: [rtoz3],
  in: {}
});
_.extend(rtoz3, {
  elName: "rtoz3",
  neighbors: [kvz1, knz1],
  in: {}
});

// цепочка  ркд
_.extend(rzdr2, {
  elName: "rzdr2",
  neighbors: [rkd],
  enabledMechanic: true,
  in: {}
});
_.extend(rkd, {
  elName: "rkd",
  neighbors: [],
  enabledMechanic: true,
  end: true,
  in: {},
  waitTime: 50, // уравнены задержки контактов
  zKontakts: [rkdz1, rkdz2, rkdz3, rkdz4],
  rKontakts: [rkdr1, rkdr2]
});

// цепочка малой
_.extend(rkdr2, {
  elName: "rkdr2",
  neighbors: [kbr1],
  enabledMechanic: true,
  in: {}
});
_.extend(rkdz4, {
  elName: "rkdz4",
  neighbors: [kbr1],
  in: {}
});
_.extend(kbr1, {
  elName: "kbr1",
  neighbors: [km],
  enabledMechanic: true,
  in: {}
});
_.extend(km, {
  elName: "km",
  neighbors: [],
  enabledMechanic: true,
  end: true,
  in: {},
  waitTime: 50, // уравнены задержки контактов
  zKontakts: [kmz1, kmz2, kmz3, kmz4],
  rKontakts: [kmr1]
});

// цепочка движения
_.extend(kvz2, {
  elName: "kvz2",
  neighbors: [rd, rkdz4],
  in: {}
});
_.extend(knz2, {
  elName: "knz2",
  neighbors: [rd, rkdz4],
  in: {}
});
_.extend(rd, {
  elName: "rd",
  neighbors: [],
  enabledMechanic: true,
  end: true,
  in: {},
  waitTime: 50, // уравнены задержки контактов
  zKontakts: [rdz1, rdz2, rdz3],
  rKontakts: [rdr1, rdr2, rdr3, rdr4]
});

// цепочка двигателя дверей
_.extend(rzdz4, {
  elName: "rzdz4",
  neighbors: [],
  begin: true,
  end: true
});
_.extend(rzdz5, {
  elName: "rzdz5",
  neighbors: [],
  begin: true,
  end: true
});
_.extend(rodz3, {
  elName: "rodz3",
  neighbors: [],
  begin: true,
  end: true
});
_.extend(rodz4, {
  elName: "rodz4",
  neighbors: [],
  begin: true,
  end: true
});

// цепочка двигателя кабины
_.extend(knz3, {
  elName: "knz3",
  neighbors: [kbz3, kmz3, rdz3],
  begin: true
});
_.extend(knz4, {
  elName: "knz4",
  begin: true
});
_.extend(kvz3, {
  elName: "kvz3",
  neighbors: [kmz3, kbz3, rdz3],
  begin: true
});
_.extend(kvz4, {
  elName: "kvz4",
  begin: true
});
_.extend(kbz3, {
  elName: "kbz3",
  end: true,
  in: {}
});
_.extend(kbz4, {
  elName: "kbz4",
  begin: true
});
_.extend(kmz3, {
  elName: "kmz3",
  end: true,
  in: {}
});
_.extend(kmz4, {
  elName: "kmz4",
  begin: true
});
_.extend(rdz3, {
  elName: "rdz3",
  neighbors: [emt],
  in: {}
});
_.extend(emt, {
  elName: "emt",
  neighbors: [],
  enabledMechanic: true,
  end: true,
  in: {}
});

rdr1.start();
rv2r1.start();
mknstopr.start();

var doorPath = 0;
var motorPath = 0;
var dk = false;
var dch = false;
var e1 = false;
var e12 = false;
var e6 = false;

door();
motor();

function door () {
  var z1 = rzdz4.isEnabled();
  var z2 = rzdz5.isEnabled();
  var o1 = rodz3.isEnabled();
  var o2 = rodz4.isEnabled();
  if (o1 && o2 && !z1 && !z2) {
    doorPath += 1;
  }
  if (z1 && z2 && !o1 && !o2) {
    doorPath -= 1;
  }
  if (doorPath >= 15) {
    vkor.enabledMechanic = false;
    delete vkor.in['door'];
    vkor.reset('door',[]);
  } else {
    vkor.enabledMechanic = true;
  }
  if (doorPath <= 0) {
    vkzz.enabledMechanic = false;
    delete vkzz.in['door'];
    vkzz.reset('door',[]);
  } else {
    vkzz.enabledMechanic = true;
  }
  if (doorPath > 0) {
    if (!dk) {
      dk = true;
      dkz.enabledMechanic = true;
      delete  dkz.in['door'];
      dkz.reset('door', []);
      dkr.enabledMechanic = false;
      delete  dkr.in['door'];
      dkr.reset('door', []);
    }
  } else {
    if (dk) {
      dk = false;
      dkz.enabledMechanic = false;
      delete  dkz.in['door'];
      dkz.reset('door', []);
      dkr.enabledMechanic = true;
      delete  dkr.in['door'];
      dkr.reset('door', []);
    }
  }

  _.delay(door, 100);
}

function motor () {
  var t    = emt.isEnabled();
  var v3 = kvz3.isEnabled();
  var v4 = kvz4.isEnabled();
  var n3 = knz3.isEnabled();
  var n4 = knz4.isEnabled();
  var b3 = kbz3.isEnabled();
  var b4 = kbz4.isEnabled();
  var m3 = kmz3.isEnabled();
  var m4 = kmz4.isEnabled();

  if (motorPath < -1 || motorPath > 61) {
    vlr.enabledMechanic = false;
    delete vlr.in['motor'];
    vlr.reset('motor',[]);
  }

  if ( v3 && v4 && b3 && b4 && !n3 && !n4 && !m3 && !m4 && t ) {
    motorPath += 1;
  }
  if ( n3 && n4 && b3 && b4 && !v3 && !v4 && !m3 && !m4 && t ) {
    motorPath -= 1;
  }
  if ( v3 && v4 && m3 && m4 && !n3 && !n4 && !b3 && !b4 && t ) {
    motorPath += 0.25;
  }
  if ( n3 && n4 && m3 && m4 && !v3 && !v4 && !b3 && !b4 && t ) {
    motorPath -= 0.25;
  }

  if ((motorPath >= 0 && motorPath <=2) || (motorPath >= 28 && motorPath <=32) || (motorPath >= 58 && motorPath <=60)) {
    if (dch) {
      dchtor.enabledMechanic = false;
      delete dchtor.in['motor'];
      dchtor.reset('motor', []);
      dch = false;
    }
  } else {
    if (!dch) {
      dchtor.enabledMechanic = true;
      delete  dchtor.in['motor'];
      dchtor.reset('motor', []);
      dch = true;
    }
  }

  if (motorPath >=0 && motorPath <=10) {
    if (!e1) {
      f1ep1z.enabledMechanic = false;
      delete f1ep1z.in['motor'];
      f1ep1z.reset('motor', []);
      f1ep3r.enabledMechanic = true;
      delete f1ep3r.in['motor'];
      f1ep3r.reset('motor', []);
      e1 = true;
    }
  } else {
    if (e1) {
      f1ep1z.enabledMechanic = true;
      delete f1ep1z.in['motor'];
      f1ep1z.reset('motor', []);
      f1ep3r.enabledMechanic = false;
      delete f1ep3r.in['motor'];
      f1ep3r.reset('motor', []);
      e1 = false;
    }
  }

  if (motorPath >= 50 && motorPath <= 60) {
    if (!e12) {
      f12ep2r.enabledMechanic = false;
      delete f12ep2r.in['motor'];
      f12ep2r.reset('motor', []);
      f12ep4z.enabledMechanic = true;
      delete f12ep4z.in['motor'];
      f12ep4z.reset('motor', []);
      e12 = true;
    }
  } else {
    if (e12) {
      f12ep2r.enabledMechanic = true;
      delete f12ep2r.in['motor'];
      f12ep2r.reset('motor', []);
      f12ep4z.enabledMechanic = false;
      delete f12ep4z.in['motor'];
      f12ep4z.reset('motor', []);
      e12 = false;
    }
  }

  if (motorPath >=20 && motorPath <=40) {
    if (!e6) {
      e6 = true;
      f6ep3r4z.enabledMechanic = true;
      delete f6ep3r4z.in['motor'];
      f6ep3r4z.reset('motor', []);
      f6ep2r.enabledMechanic = false;
      delete f6ep2r.in['motor'];
      f6ep2r.reset('motor', []);
      f6ep1z.enabledMechanic = false;
      delete f6ep1z.in['motor'];
      f6ep1z.reset('motor', []);
    }
  } else {
    if (e6) {
     e6 = false;
      f6ep3r4z.enabledMechanic = false;
      delete f6ep3r4z.in['motor'];
      f6ep3r4z.reset('motor', []);
      if (motorPath > 40) {
        f6ep1z.enabledMechanic = true;
        delete f6ep1z.in['motor'];
        f6ep1z.reset('motor', []);
      }
      if (motorPath < 20) {
        f6ep2r.enabledMechanic = true;
        delete f6ep2r.in['motor'];
        f6ep2r.reset('motor', []);
      }
    }
  }

  _.delay(motor, 100);
}