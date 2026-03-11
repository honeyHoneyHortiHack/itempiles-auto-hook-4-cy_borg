// Item Piles Auto Hook - Automatically convert dead actors to item piles (NPCs & characters)
// Compatible with FoundryVTT v13 and CY_BORG v4.0.2

Hooks.once("init", () => {
  // Register settings for notification control
  game.settings.register("itempiles-auto-hook", "notifyModuleLoaded", {
    name: "Module Loaded Notification",
    hint: "Show notification when the module is loaded",
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register("itempiles-auto-hook", "notifyHookInstalled", {
    name: "Hook Installed Notification", 
    hint: "Show notification when the auto-conversion hook is installed",
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register("itempiles-auto-hook", "notifyActorDied", {
    name: "Actor Death Notification",
    hint: "Show notification when an actor dies and becomes an item pile",
    scope: "client", 
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register("itempiles-auto-hook", "notifyActorRevived", {
    name: "Actor Revival Notification",
    hint: "Show notification when an actor is revived and stops being an item pile",
    scope: "client",
    config: true, 
    type: Boolean,
    default: true
  });
});

Hooks.once("ready", () => {
  // Check setting before showing module loaded notification
  if (game.settings.get("itempiles-auto-hook", "notifyModuleLoaded")) {
    ui.notifications.info("Item Piles Auto Hook module loaded!");
  }
  
  // Auto-monitoring version - run this once to set up automatic conversion
  Hooks.on("updateActor", async (actor, updateData, options, userId) => {
    // Only run for the GM or if the user owns the actor
    if (!game.user.isGM && !actor.isOwner) return;
    
    // Only process NPCs or characters (both linked and unlinked)
    if (!["npc","character"].includes(actor.type)) return;
    
    // Check if HP was updated
    const hpPath = "system.hitPoints.value"; // For CY_BORG, adjust if using a different system
    
    if (!foundry.utils.hasProperty(updateData, hpPath)) return;
    
    const currentHP = foundry.utils.getProperty(actor, hpPath);
    const isCurrentlyItemPile = game.itempiles.API.isValidItemPile(actor);
    
    try {
      if (currentHP <= 0 && !isCurrentlyItemPile) {
        await game.itempiles.API.updateItemPile(actor, {
          enabled: true,
          type: "pile",
          deleteWhenEmpty: true
        });
        
        // Check setting before showing death notification
        if (game.settings.get("itempiles-auto-hook", "notifyActorDied")) {
          ui.notifications.info(`${actor.name} died and became an item pile`);
        }
      }
      else if (currentHP > 0 && isCurrentlyItemPile) {
        await game.itempiles.API.updateItemPile(actor, {
          enabled: false
        });
        
        // Check setting before showing revival notification
        if (game.settings.get("itempiles-auto-hook", "notifyActorRevived")) {
          ui.notifications.info(`${actor.name} was revived and is no longer an item pile`);
        }
      }
    } catch (error) {
      console.error(`Auto pile conversion failed for ${actor.name}:`, error);
    }
  });
  
  // Check setting before showing hook installed notification
  if (game.settings.get("itempiles-auto-hook", "notifyHookInstalled")) {
    ui.notifications.info("Auto item pile conversion hook installed!");
  }
}); 