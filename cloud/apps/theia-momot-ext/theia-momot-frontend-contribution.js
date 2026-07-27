/**
 * Skeleton contribution point for the Theia MOMoT Extension.
 * Illustrates how the extension would register the MOMoT Trade-offs View, menu actions,
 * and command handlers using @momot/momot-tradeoff-ui and @momot/momot-emfcloud-bridge.
 */

export const MOMOT_TRADEOFFS_VIEW_ID = 'momot-tradeoffs-view';

export const SHOW_MOMOT_TRADEOFFS_COMMAND = {
  id: 'momot.show.tradeoffs',
  label: 'MOMoT: Explore Pareto Trade-offs'
};

/**
 * Typical Eclipse Theia contribution for registering frontend UI widgets, menus, and commands.
 */
export class TheiaMomotFrontendContribution {
  /**
   * @param {object} bridge - Instance of DefaultMomotEmfcloudBridge
   */
  constructor(bridge) {
    this.bridge = bridge;
  }

  /**
   * Registers custom extension commands in the Theia command registry.
   * 
   * @param {object} commands - Theia CommandRegistry
   */
  registerCommands(commands) {
    commands.registerCommand(SHOW_MOMOT_TRADEOFFS_COMMAND, {
      execute: () => this.openTradeoffsView()
    });
  }

  /**
   * Registers menu entries for commands in the main menu bar or context menus.
   * 
   * @param {object} menus - Theia MenuModelRegistry
   */
  registerMenus(menus) {
    menus.registerMenuAction('view', {
      commandId: SHOW_MOMOT_TRADEOFFS_COMMAND.id,
      label: SHOW_MOMOT_TRADEOFFS_COMMAND.label
    });
  }

  /**
   * Command execution: launches the MOMoT trade-off exploration view widget.
   */
  async openTradeoffsView() {
    console.log('MOMoT: Trade-offs view opened successfully!');
    // In a production environment, this method would fetch the Pareto front using results helpers,
    // construct the MomotTradeoffPlot, render the SVG DOM node using plot.renderToDom(),
    // and append it to a native Theia React/Phosphor Widget container.
  }
}
