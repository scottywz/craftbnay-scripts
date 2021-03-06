var ALIASES = {
 // Format:  "Original name": "Alias"
};

//////////////////////////////////////////////////////////////////////////

/*  Copyright (c) 2013 Scott Zeid.  Released under the X11 License.  */

var USAGE = "/<command> {ls [page]|[set] [prefix/]anchorName}";
var DESCRIPTION = "Teleports the calling player to an anchor, creates a"
                + " new anchor, or lists the existing anchors.";

var SCRIPT_PDF = {
 "name": "CraftBnay-Anchor",
 "version": "1.0",
 "authors": ["Scott Zeid"],
 "commands": {
  "a":      {"usage": USAGE, "description": DESCRIPTION},
  "anchor": {"usage": USAGE, "description": DESCRIPTION}
 }
};

//////////////////////////////////////////////////////////////////////////

importClass(java.util.logging.Level);

importClass(org.bukkit.entity.Player);
 
function onEnable() {}
function onDisable() {}

function onCommand(sender, command, label, args) {
 if (["a", "anchor"].indexOf(String(command.getName().toLowerCase())) > -1) {
  var exec = makeExec(sender);
  
  if (args.length < 1)
   return false;
  
  args = arrayToString(args);
  if (args[0] === "ls") {
   var page = (args.length > 1) ? args[1] : "1";
   if (page.match(/^[0-9]+$/)) {
    exec(["mv", "anchor", page]);
    return true;
   }
  } else {
   if (!(sender instanceof Player)) {
    sender.sendMessage("This command must be sent by a Player, not a "
                        + sender.getClass().getSimpleName());
    return true;
   }
   
   //helper.log(Level.INFO, "World prefix: " + getPrefix(sender.getWorld().getName()));
   var anchorArg = args.slice((args[0] === "set") ? 1 : 0).join(" ");
   var anchor = anchorArg;
   if (!anchor.match(/^([a-zA-Z]+)\//))
    anchor = getPrefix(sender.getWorld().getName()) + "/" + anchor;
   
   if (args[0] === "set" && anchorArg != "")
    exec(["mv", "anchor", anchor]);
   else
    exec(["mvtp", "a:" + anchor]);
   
   return true;
  }
 }
 return false;
};

function makeExec(sender) {
 if (typeof(sender) == "undefined") sender = server.getConsoleSender();
 
 return function(argv) {
  var cmd = argv[0].replace(/^\//, "");
  //helper.log(Level.INFO, "[exec] Executing: " + argv.join(" "));
  return server.getPluginCommand(cmd).execute(sender, cmd, argv.slice(1));
 }
}

function getPrefix(world) {
 return getAlias(world).toLowerCase().charAt(0);
}

function getAlias(name) {
 name = String(name);
 for (world in ALIASES) {
  if (ALIASES.hasOwnProperty(world)) {
   var alias = ALIASES[world];
   if (name == world)
    return alias;
   if (name.substr(0, world.length + 1) == world + "_")
    return alias + name.match(/_.*$/)[0];
  }
 }
 return name;
}

function arrayToString(array) {
 var result = [];
 for (var i = 0; i < array.length; i++)
  result.push(String(array[i]));
 return result;
}
