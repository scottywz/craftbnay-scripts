/*  Copyright (c) 2013-2016 Scott Zeid.  Released under the X11 License.  */

var USAGE = "/<command> [@[<player>]] {<enchantment level>[,...]|--verbose|[--]<flag> [...]}|flags";
var DESCRIPTION = "Get the price for an enchantment from The Enchanted"
                + " Cottage.";

var SCRIPT_PDF = {
 "name": "CraftBnay-Cottage",
 "version": "1.0",
 "authors": ["Scott Zeid"],
 "commands": {
  "cottage": {"usage": USAGE, "description": DESCRIPTION}
 }
};

//////////////////////////////////////////////////////////////////////////

VENUE = "The Enchanted Cottage";
SLOGAN = "Doing Satya's bidding since before He was CEO.";

PRICE_MODIFIERS = [
 ["$1 per level per enchantment",
  "base",
  function(i) { i.price += 1 * i.levels; }],
 // Fees
 ["$5 Service fee per visit",
  "service",
  function(i) { i.fees += 5; }],
 ["$10 No enchantment fee (NEF)",
  "nef",
  function(i) { i.fees += (i.enchantments == 0) && 10; }],
 ["$10 Observation fee (plus NEF)",
  "--observing",
  function(i) { i.add("nef"); i.fees += 10; }],
 ["$9 Self-service fee per level",
  "--self-service",
  function(i) { i.fees += 9 * i.levels; }],
 ["$18 fee per minor present",
  "--minors=n",
  function(i) { i.fees += 18 * i.flags.minors; }],
 ["$100 Entrance fee",
  "entrance",
  function(i) { i.fees += 100; }],
 ["$25 Exit fee",
  "exit",
  function(i) { i.fees += 25; }],
 ["$200 ETF",
  "--etf",
  function(i) { i.fees += 200; }],
 ["$500 Fee per minecart in inventory or hotbar",
  "--minecarts=n",
  function(i, n) { i.fees += 500 * n; }],
 ["$250 Fee for complaining about excessive fees",
  "--complaining",
  function(i) { i.fees += 250; }],
 ["$800* Jumping Frog Fee Effective 2013-03-16 (* per level)",
  "jumping-frog",
  function(i) { i.fees += 800 * i.levels; }],
 ["$2,500/level Overdraft fee",
  "--overdraft",
  function(i) { i.fees += 2500 * i.levels; }],
 ["$1m/level for returned checks",
  "--returned-check",
  function(i) { i.fees += 1000000 * i.levels; }],
 ["$100/level Fee to help us with our bankruptcy court costs",
  "bankruptcy-court",
  function(i) { i.fees += 100 * i.levels; }],
 ["$250,000 Fee per level for all bankruptcy court judges",
  "--bankruptcy-judge",
  function(i) { i.fees += 250000 * i.levels; }],
 ["$40m/level wait-outside fee",
  "--wait-outside",
  function(i) { i.fees += 40000000 * i.levels; }],
 ["$1b/level for Microsoft critics",
  "--microsoft-critic",
  function(i) { i.fees += 1000000000 * i.levels; }],
 ["ALL Apple users: $999 trillion per level per device per millisec. fee!",
  "--apple-devices=n",    // assuming 1 minute
  function(i, n) { i.fees += 999000000000000 * i.levels * n * 60000; }],
 ["Linux - $20bn/level/minute",
  "--linux",
  function(i) { i.fees += 20000000000 * i.levels; }],
 ["GNU/Linux: $40bn/level/minute",
  "--gnu-linux",
  function(i) { i.add("linux"); i.fees += 40000000000 * i.levels; }],
 ["GNU+Linux: $80bn/level/minute",
  "--gnu-plus-linux",
  function(i) { i.add("gnu-linux"); i.fees += 80000000000 * i.levels; }],
 ["Android: $160bn/level/minute",
  "--android",
  function(i) { i.add("linux"); i.fees += 160000000000 * i.levels; }],
 ["Arch: $655.36tn/level/minute",
  "--arch",
  function(i) { i.add("gnu-plus-linux"); i.fees += 655360000000000 * i.levels; }],
 // Concessions
 ["MSFT employees + board:  95% OFF!",
  "--msft",
  function(i) { i.percentConcessions += 95; }],
 ["Satya Nadella: ALL FEES WAIVED!!!",
  "--satya-nadella",
  function(i) { i.add("msft"); i.feesWaived = true; }],
 ["1¢ off if you can read this sign",
  "--can-read-hidden-sign",
  function(i) { i.concessions += 0.01; }],
 // Surcharges
 ["5% surcharge per enchantment",
  "enchantment-surcharge",
  function(i) { i.percentSurcharges += 5 * i.enchantments; }],
 ["Effective Friday, November 13, 2015:  6.66% per level surcharge",
  "level-surcharge",
  function(i) { i.percentSurcharges += 6.66 * i.levels; }],
 // Taxes
 ["8.25% sales tax",
  "sales-tax",
  function(i) { i.taxes += 0.0825; }],
 ["5% Bnayland Enchantment Tax (BET)",
  "bet",
  function(i) { i.taxes += 0.05; }],
 ["Tax exempt",
  "--tax-exempt",
  function(i) { i.taxesWaived = true; }]
];

//////////////////////////////////////////////////////////////////////////

IS_BUKKIT = (typeof(importClass) == "function" &&
             typeof(org) == "object" && org.bukkit);
IS_NODE   = (typeof(process) == "object" && process.argv);

SYSTEM_FLAGS = ["verbose"];


/* Start portable code (plus the stuff above) */

function main(argv, stdout, stderr) {
 if (typeof(argv) == "undefined")
  argv = new Array();
 if (typeOf(argv) != "Array")
  argv = String(argv).split(" ");
 argv = arrayToString(argv);
 if (typeof(print) != "function" && typeof(console) == "object" && console.log)
  stdout = console.log;
 if (typeof(stderr) != "function")
  stderr = stdout;
 
 var usage = USAGE.replace(/^\/<command>/i, "");
 usage = argv[0] + usage;
 
 var args = argv.slice(1);
 
 if (args.length < 1) {
  !IS_BUKKIT && stderr(usage);
  return 2;
 }

 var playerName = null;
 if (args[0].match(/^@/)) {
  if (args.length < 2) {
   !IS_BUKKIT && stderr(usage);
   return 2;
  }
  playerName = args[0].replace(/^@/, "");
  args = args.slice(1);
 }
 
 if (args[0].toLowerCase() == "flags") {
  stdout("Flags:  " + getFlags().join(", "));
  return 0;
 } else {
  var enchantmentString = "";
  var flagList = [];
  for (var i = 0; i < args.length; i++) {
   if (args[i].match(/^[0-9,]+$/))
    enchantmentString += "," + args[i];
   else
    flagList.push(args[i]);
  }
  enchantmentString = enchantmentString.replace(/^,+/, "");
  enchantmentString = enchantmentString.replace(/,,+/g, "");
  enchantmentString = enchantmentString.replace(/,+$/, "");
  if (!enchantmentString)
   enchantmentString = "0";
  var cottage = new Cottage(enchantmentString, flagList);
  var verbose = cottage.flags.verbose;
  if (cottage.flags.verbose) {
   var receipt = cottage.receipt();
   var thank = "Thank you" + ((playerName) ? ", " + playerName + "," : "")
   for (var i = 0; i < receipt.length; i++)
    stdout(receipt[i].replace(/^Thank you/, thank));
  } else {
   summary = cottage.summary();
   summary = "For " + ((playerName) ? playerName : "you") + ", " + summary;
   stdout(summary);
  }
  return 0;
 }
}

function Cottage(enchantmentList, flags) {
 if (typeof(enchantmentList) == "undefined") enchantmentList = [];
 if (typeof(flags)           == "undefined") flags           = new Flags();
 
 if (typeOf(enchantmentList) != "Array")
  enchantmentList = String(enchantmentList).split(",");
 if (!(flags instanceof Flags)) {
  flags = new Flags(flags);
 }
 
 var enchantments = 0;
 var levels       = 0;
 var price        = 0;
 
 for (var i = 0; i < enchantmentList.length; i++) {
  var enchantment = Number(enchantmentList[i]);
  if (enchantment > 0) {
   enchantments += 1;
   levels       += enchantment;
  }
 }
 
 var added = [];
 var previousTotal = 0;
 
 var info = {
  enchantments:       enchantments,
  levels:             levels,
  flags:              flags,
  price:              price,
  fees:               0,
  percentFees:        0,
  feesWaived:         false,
  concessions:        0,
  percentConcessions: 0,
  concessionsDisplay: 0,
  surcharges:         0,
  percentSurcharges:  0,
  surchargesWaived:   false,
  taxes:              0,
  taxesWaived:        false,
  itemized:           [],
  add:                function(what, n) {
   function Modifier(o) {
    var result = {};
    result.array = o;
    result.description = o[0];
    result.key = o[1];
    result.modify = o[2];
    
    result.flag = false;
    if (result.key.match(/^--?/)) {
     result.flag = result.key;
     result.key = result.flag.replace(/^--?/, "").replace(/=.*$/, "");
    }
    
    return result;
   }
   
   var modifier = null;
   var manual = false;
   if (typeof(what) != "string") {
    modifier = Modifier(what);
    what = modifier.key;
   } else {
    what = what.replace(/^--?/, "").replace(/=.*$/, "");
    if (added.indexOf(what) < 0) {
     for (var i = 0; i < PRICE_MODIFIERS.length; i++) {
      var test = Modifier(PRICE_MODIFIERS[i]);
      if (test.key == what) {
       modifier = test;
       manual = true;
       break;
      }
     }
    }
   }
   
   if (added.indexOf(what) < 0) {
    if (!modifier.flag || flags[modifier.key] || manual) {
     var self = this;
     modifier.modify(self, (!manual) ? flags[what] : n);
     var cost = this.total() - previousTotal;
     if (cost != 0)
      this.itemized.push([modifier.description, cost]);
     if (cost < 0)
      this.concessionsDisplay += -cost;
     added.push(what);
     previousTotal = this.total();
    }
   }
  },
  baseSubtotal:       function() {
   return this.price;
  },
  baseTotal:          function() {
   return this.baseSubtotal();
  },
  feeSubtotal:        function() {
   return this.fees
          + this.baseTotal()
	    * (this.percentFees / 100);
  },
  feeTotal:           function() {
   return this.feeSubtotal() * !this.feesWaived;
  },
  concessionTotal:    function() {
   return this.concessions
          + (this.baseTotal() + this.feeTotal())
	    * (this.percentConcessions / 100);
  },
  surchargeSubtotal:  function() {
   return this.surcharges
          + (this.baseTotal() + this.feeTotal() - this.concessionTotal())
	    * (this.percentSurcharges / 100);
  },
  surchargeTotal:     function() {
   return this.surchargeSubtotal() * !this.surchargesWaived;
  },
  subtotal:           function() {
   return this.baseTotal() + this.feeTotal() - this.concessionTotal()
          + this.surchargeTotal();
  },
  taxTotal:           function() {
   return this.subtotal() * (this.taxes * !this.taxesWaived);
  },
  total:              function() {
   return this.subtotal() + this.taxTotal();
  },
  receipt:            function() {
   var result = [];
   function line(s) { result.push(s); }
   function iline(s) {
    // indented line
    if (s.substr(0, 1) == "-")
     s = "   " + s;
    else
     s = "    " + s;
    line(s);
   }
   VENUE && line(VENUE.toUpperCase());
   SLOGAN && line("    " + SLOGAN);
   var nLine = "";
   nLine += this.enchantments + " enchantment";
   if (this.enchantments != 1) nLine += "s";
   nLine += ", ";
   nLine += this.levels + " total level";
   if (this.levels != 1) nLine += "s";
   nLine += ":"
   line(nLine);
   var items = this.itemized;
   for (var i = 0; i < items.length; i++) {
    var item = items[i];
    iline(formatCurrency(item[1]) + " - " + item[0]);
   }
   iline(formatCurrency(this.feeTotal()) + " - Total fees");
   iline(formatCurrency(-this.concessionsDisplay) + " - Total concessions");
   iline(formatCurrency(this.surchargeTotal()) + " - Total surcharges");
   iline(formatCurrency(this.subtotal()) + " - Subtotal");
   iline(formatCurrency(this.taxTotal()) + " - Total taxes");
   iline(formatCurrency(this.total()) + " - Grand Total");
   line("Thank you for cheerfully choosing " + VENUE + "!");
   return result;
  },
  summary:            function() {
   var result = "";
   result += this.enchantments + " enchantment";
   if (this.enchantments != 1) result += "s";
   result += " with a total of ";
   result += this.levels + " level";
   if (this.levels != 1) result += "s";
   result += " will cost ";
   result += formatCurrency(this.total());
   result += " at " + VENUE + ".";
   return result;
  }
 };
 
 for (var i = 0; i < PRICE_MODIFIERS.length; i++)
  info.add(PRICE_MODIFIERS[i]);
 
 return info;
}

function formatCurrency(amount, symbol) {
 if (typeof(symbol) == "undefined") symbol = "$";

 var decimalPlaces = 2;

 var negative = false;
 if (amount < 0) {
  negative = true;
  amount = Math.abs(amount);
 }
 
 // handle numbers whose absolute value is >= 1e21
 if (String(amount).match("e+")) {
  var real = "";
  var exp = Number(String(amount).replace(/^[^+]*\+/, ""));
  var l = String(amount).replace(/e+.*$/i, "").replace(/\..*$/, "");
  var r = String(amount).replace(/e+.*$/i, "").replace(/^[^.]*\./, "");
  var zeroes = (exp + 1) - l.length;
  for (var i = 0; i < Math.abs(zeroes - r.length); i++)
   real += "0";
  real = l + r + real;
  amount = real;
 }
 
 var ret = "";
 // split into parts
 var parts = (String(amount) + ".0").split(".").slice(0,2);
 var whole = Number(parts[0]);
 var decimal = amount - Math.floor(amount);
 
 // round decimal to appropriate number of places
 var decMul = Math.pow(10, decimalPlaces);
 decimal = Number(decimal) * decMul;
 var decimalAfter = String(decimal - Math.floor(decimal));
 decimal = Math.round(decimal) / decMul;
 // handle floating point error after needed number of places
 var origPlace = Math.floor(decimalAfter * 10);
 if (Math.round(decimalAfter * 10) >= 5 && origPlace < 5)
  decimal += 0.01;
 // handle rounding to next whole number
 if (decimal >= 1) {
  whole += Math.floor(decimal);
  decimal -= Math.floor(decimal);
 }
 // format decimal string (without leading dot)
 decimal = String(decimal).replace(/^0*\./, "");
 for (var i = 0; i < decimalPlaces; i++)
  decimal += "0";
 decimal = decimal.slice(0, decimalPlaces);
 
 // add thousands separators
 whole = String(whole).split("");
 for (var i = parts[0].length; i > 3; i -= 3) {
  whole.splice(i - 3, 0, ",");
 }
 whole = whole.join("");
 
 // prepare result
 ret += whole;
 ret += ".";
 ret += decimal;
 ret = symbol + ret;
 if (negative)
  ret = "-" + ret;
 return ret;
}

function getFlags() {
 var flags = [];
 for (var i = 0; i < SYSTEM_FLAGS.length; i++)
  flags.push(SYSTEM_FLAGS[i]);
 for (var i = 0; i < PRICE_MODIFIERS.length; i++) {
  var key = PRICE_MODIFIERS[i][1];
  if (typeof(key) == "string" && key.match(/^--?/))
   flags.push(PRICE_MODIFIERS[i][1].replace(/^--?/, ""));
 }
 return flags;
};

function Flags(flags) {
 if (flags instanceof Flags)
  return flags;
 if (typeof(flags) == "undefined")
  flags = new Array();
 if (typeOf(flags) != "Array")
  flags = String(flags).replace(",", " ").split(" ");
 this.toArray = function() { 
  var result = [];
  for (var i = 0; i < flags.length; i++)
   result.push(flags[i].replace(/^--/, "").replace(/=.*$/, ""));;
  return result;
 };
 // update flags list
 // this needs to be here because reasons (TODO: explain the reasons)
 Flags.prototype.FLAGS = getFlags();
 Flags.prototype.TYPES = {};
 for (var i = 0; i < Flags.prototype.FLAGS.length; i++) {
  var name  = Flags.prototype.FLAGS[i];
  var name2 = name;
  var type;
  if (name.match(/=n$/i)) {
   name2 = name.replace(/=n$/i, "");
   type  = Number;
  } else if (name.match(/=.*$/)) {
   name2 = name.replace(/=.*$/, "");
   type  = String;
  } else
   type  = Boolean;
  Flags.prototype.TYPES[name] = type;
  if (name !== name2)
   Flags.prototype.TYPES[name2] = type;
 }
 // initialize instance members
 for (var i = 0; i < this.FLAGS.length; i++) {
  var name = this.FLAGS[i];
  if (name.match(/=n$/i))
   name = name.replace(/=n$/i, "");
  else if (name.match(/=.*$/))
   name = name.replace(/=.*$/, "");
  var member = name.replace(/-[a-z]/g, function(s) { 
   return s.replace("-", "").toUpperCase();
  });
  this[member] = this[name] = this.TYPES[name]();
 }
 // populate instance members
 for (var i = 0; i < flags.length; i++) {
  var flag   = flags[i].replace(/^--?/, "");
  var name   = flag.replace(/=.*$/, "").replace(/[A-Z]/g, function(s) {
   return "-" + s.toLowerCase();
  }).replace(/^-/, "");
  var member = name.replace(/-[a-z]/g, function(s) {
   return s.replace("-", "").toUpperCase();
  });
  var type = this.TYPES[name];
  if (typeof(type) == "undefined") continue;
  value = this[member];
  if (type === Boolean)
   value = true;
  else
   value = this.TYPES[name](flag.replace(/^[^=]*(=|$)/, ""));
  this[member] = this[name] = value;
  //if (type === Number && this[member] != this[member])
  // this[member] = 0;
 }
 return this;
}

function typeOf(o) {
 if (typeof(o) == "undefined")
  return "undefined";
 if (o === null)
  return "null";
 return Object.prototype.toString.apply(o)
         .replace(/^\[object /i, "")
         .replace(/\]$/, "")
}

function arrayToString(array) {
 var result = [];
 for (var i = 0; i < array.length; i++)
  result.push(String(array[i]));
 return result;
}

/* End portable code */


/* Start Bukkit-specific code */

if (IS_BUKKIT) {
 importClass(org.bukkit.ChatColor);
 importClass(org.bukkit.Material);
 importClass(org.bukkit.Server);
 importClass(org.bukkit.entity.Player);
}

MINECART_TYPES = [];
if (IS_BUKKIT) {
 var materials = arrayToString(Material.values());
 for (var i = 0; i < materials.length; i++) {
  var name = materials[i];
  if (name.match(/(^|_)MINECART$/i))
   MINECART_TYPES.push(name);
 }
}

function onEnable() {}
function onDisable() {}

function onCommand(sender, command, label, args) {
 if (command.getName().toLowerCase() == "cottage") {
  if (args.length < 1)
   return false;
  
  args = arrayToString(args);
  
  var playerName = null;
  var player = sender;
  if (args[0].match(/^@/)) {
   if (args.length < 2)
    return false;
   playerName = args[0].replace(/^@/, "");
   if (playerName.length > 0) {
    player = getPlayer(playerName, sender);
    if (player == null)
     return true;
    playerName = player.getName();
    if (playerName == sender.getName())
     playerName = null;
   }
   if (playerName)
    args[1] = "@" + playerName;
  }
  
  var minecarts = countMinecarts(player);
  if (minecarts > 0) {
   var argN = (args[0].match(/^@/)) ? 1 : 0;
   args.splice(argN, 0, "--minecarts=" + String(minecarts));
  }
  
  var r = main(["cottage"].concat(args), function(s) {
   s = String(s);
   if (s.substr(0, 4) == "   -")
    s = "   –" + s.substr(4);
   sender.sendMessage(s);
  });
  return r == 0;
 }
 return false;
}

function getPlayer(player, caller) {
 if (!IS_BUKKIT) return null;
 var name = player;
 var offlinePlayer = server.getOfflinePlayer(player);
 player = offlinePlayer.getPlayer();
 if (!player) {
  if (caller) {
   if (!offlinePlayer.hasPlayedBefore())
    caller.sendMessage("The player " + name + " does not exist");
   else
    caller.sendMessage("The player " + name + " is offline");
  }
  return null;
 }
 return player;
}

function countMinecarts(player) {
 if (!IS_BUKKIT) return null;
 var minecarts = 0;
 if (player instanceof Player) {
  for (var i = 0; i < MINECART_TYPES.length; i++) {
   try {
    var type = Material.valueOf(MINECART_TYPES[i]);
   } catch (e) {
    if (e.javaException instanceof java.lang.IllegalArgumentException)
     continue;
    else
     throw e;
   }
   var stacks = player.getInventory().all(type).values().toArray();
   for (var j = 0; j < stacks.length; j++) {
    minecarts += stacks[j].getAmount();
   }
  }
 }
 return minecarts;
}

/* End Bukkit-specific code */


/* Start Node.js-specific code */

if (IS_NODE) {
 function print(to, what, newline) {
  if (typeof(newline) == "undefined") newline = true;
  to.write(String(what) + ((newline) ? "\n" : ""));
 }
 function stdout(what, newline) { print(process.stdout, what, newline); }
 function stderr(what, newline) { print(process.stderr, what, newline); }
 var argv = process.argv.slice(1);
 var r = main(argv, stdout, stderr);
 process.exit(r);
}

/* End Node.js-specific code */
