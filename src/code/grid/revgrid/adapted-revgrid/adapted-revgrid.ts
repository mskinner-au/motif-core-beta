/**
 * @license Motif
 * (c) 2021 Paritech Wealth Technology
 * License: motionite.trade/license/motif
 */

// import { ColorScheme, GridField, MultiEvent, SettingsService } from '@motifmarkets/motif-core';
import { Revgrid, ViewLayout } from '@xilytix/revgrid';
import { ColorScheme, SettingsService } from '../../../services/services-internal-api';
import { MultiEvent } from '../../../sys/sys-internal-api';
import { AllowedGridField, GridField } from '../../field/grid-field-internal-api';
import { AllowedFieldsGridLayoutDefinition, GridLayoutDefinition } from '../../layout/definition/grid-layout-definition-internal-api';
import {
    AdaptedRevgridBehavioredColumnSettings,
    AdaptedRevgridBehavioredGridSettings,
    AdaptedRevgridGridSettings,
    InMemoryAdaptedRevgridBehavioredColumnSettings,
    InMemoryAdaptedRevgridBehavioredGridSettings,
    defaultAdaptedRevgridGridSettings
} from '../settings/grid-revgrid-settings-internal-api';

export abstract class AdaptedRevgrid extends Revgrid<AdaptedRevgridBehavioredGridSettings, AdaptedRevgridBehavioredColumnSettings, GridField> {
    // resizedEventer: AdaptedRevgrid.ResizedEventer | undefined;
    // renderedEventer: AdaptedRevgrid.RenderedEventer | undefined;
    columnsViewWidthsChangedEventer: AdaptedRevgrid.ColumnsViewWidthsChangedEventer | undefined;
    // columnWidthChangedEventer: AdaptedRevgrid.ColumnWidthChangedEventer | undefined;

    protected readonly _settingsService: SettingsService;

    private _settingsChangedSubscriptionId: MultiEvent.SubscriptionId;

    constructor(
        settingsService: SettingsService,
        gridHostElement: HTMLElement,
        definition: Revgrid.Definition<AdaptedRevgridBehavioredColumnSettings, GridField>,
        customGridSettings: AdaptedRevgrid.CustomGridSettings,
        public customiseSettingsForNewColumnEventer: AdaptedRevgrid.CustomiseSettingsForNewColumnEventer,
        externalParent: unknown,
    ) {
        const gridSettings = AdaptedRevgrid.createGridSettings(settingsService, customGridSettings);

        const options: Revgrid.Options<AdaptedRevgridBehavioredGridSettings, AdaptedRevgridBehavioredColumnSettings, GridField> = {
            externalParent,
            canvasRenderingContext2DSettings: {
                alpha: false,
            }
        }
        super(
            gridHostElement,
            definition,
            gridSettings,
            (field) => this.getSettingsForNewColumn(field),
            options
        );

        this._settingsService = settingsService;

        this._settingsChangedSubscriptionId = this._settingsService.subscribeSettingsChangedEvent(() => { this.handleSettingsChangedEvent(); });
        this.verticalScroller.setAfterInsideOffset(0);
        this.horizontalScroller.setAfterInsideOffset(0);
    }

    get emWidth() { return this.canvas.gc.getEmWidth(); }

    override destroy(): void {
        this._settingsService.unsubscribeSettingsChangedEvent(
            this._settingsChangedSubscriptionId
        );
        this._settingsChangedSubscriptionId = undefined;
        super.destroy();
    }

    createAllowedFieldsGridLayoutDefinition(allowedFields: readonly AllowedGridField[]) {
        const definitionColumns = this.createGridLayoutDefinitionColumns();
        return new AllowedFieldsGridLayoutDefinition(definitionColumns, allowedFields, this.settings.fixedColumnCount);
    }

    createGridLayoutDefinition() {
        const definitionColumns = this.createGridLayoutDefinitionColumns();
        return new GridLayoutDefinition(definitionColumns);
    }

    // autoSizeColumnWidth(columnIndex: number): void {
    //     this.autosizeColumn(columnIndex);
    // }

    autoSizeAllColumnWidths(widenOnly: boolean): void {
        this.autoSizeActiveColumnWidths(widenOnly);
    }

    calculateHeaderPlusFixedRowsHeight(): number {
        return this.subgridsManager.calculatePreMainPlusFixedRowsHeight();
    }

    protected override descendantProcessColumnsViewWidthsChanged(changeds: ViewLayout.ColumnsViewWidthChangeds) {
        if (this.columnsViewWidthsChangedEventer !== undefined) {
            this.columnsViewWidthsChangedEventer(
                changeds.fixedChanged,
                changeds.scrollableChanged,
                changeds.visibleChanged
            );
        }
    }

    // protected override descendantProcessResized() {
    //     if (this.resizedEventer !== undefined) {
    //         this.resizedEventer();
    //     }
    // }

    // protected override descendantProcessRendered() {
    //     if (this.renderedEventer !== undefined) {
    //         this.renderedEventer();
    //     }
    // }

    protected applySettings() {
        const settingsServicePartialGridSettings = AdaptedRevgrid.createSettingsServicePartialGridSettings(this._settingsService);

        const settingCount = Object.keys(settingsServicePartialGridSettings).length;
        let result: boolean;
        if (settingCount > 0) {
            result = this.settings.merge(settingsServicePartialGridSettings);
        } else {
            result = false;
        }

        return result;
    }

    private handleSettingsChangedEvent(): void {
        const gridPropertiesUpdated = this.applySettings();


        if (!gridPropertiesUpdated) {
            this.invalidateAll();
        }
    }

    private getSettingsForNewColumn(field: GridField) {
        const columnSettings = new InMemoryAdaptedRevgridBehavioredColumnSettings(this.settings);
        // columnSettings.merge(defaultAdaptedRevgridColumnSettings); // default is existing grid settings
        const fieldDefinition = field.definition;
        const defaultWidth = fieldDefinition.defaultWidth;
        const defaultColumnAutoSizing = defaultWidth === undefined;
        columnSettings.defaultColumnAutoSizing = defaultColumnAutoSizing;
        if (!defaultColumnAutoSizing) {
            columnSettings.defaultColumnWidth = defaultWidth;
        }
        columnSettings.horizontalAlign = fieldDefinition.defaultTextAlign;
        this.customiseSettingsForNewColumnEventer(columnSettings);
        return columnSettings;
    }

    private createGridLayoutDefinitionColumns() {
        const activeColumns = this.activeColumns;
        const activeCount = activeColumns.length;
        const definitionColumns = new Array<GridLayoutDefinition.Column>(activeCount);

        for (let i = 0; i < activeCount; i++) {
            const activeColumn = activeColumns[i];
            const autoSizableWidth = activeColumn.autoSizing ? undefined : activeColumn.width;
            const definitionColumn: GridLayoutDefinition.Column = {
                fieldName: activeColumn.field.name,
                visible: true,
                autoSizableWidth,
            };
            definitionColumns[i] = definitionColumn;
        }
        return definitionColumns;
    }

    protected abstract invalidateAll(): void;
}

export namespace AdaptedRevgrid {
    export type SettingsChangedEventer = (this: void) => void;
    export type CustomiseSettingsForNewColumnEventer = (this: void, columnSettings: AdaptedRevgridBehavioredColumnSettings) => void;
    // export type ResizedEventer = (this: void) => void;
    // export type RenderedEventer = (this: void /*, detail: Hypergrid.GridEventDetail*/) => void;
    export type ColumnsViewWidthsChangedEventer = (
        this: void,
        fixedChanged: boolean,
        nonFixedChanged: boolean,
        allChanged: boolean
    ) => void;

    export type CustomGridSettings = Partial<AdaptedRevgridGridSettings>;

    export function createGridSettings(settingsService: SettingsService, customSettings: Partial<AdaptedRevgridGridSettings>): AdaptedRevgridBehavioredGridSettings {
        const settingsServiceGridSettings = createSettingsServicePartialGridSettings(settingsService);
        const gridSettings = new InMemoryAdaptedRevgridBehavioredGridSettings();
        gridSettings.merge(defaultAdaptedRevgridGridSettings);
        gridSettings.merge(customSettings);
        gridSettings.merge(settingsServiceGridSettings);
        return gridSettings;
    }

    export function createColumnSettings(gridSettings: AdaptedRevgridBehavioredGridSettings): AdaptedRevgridBehavioredColumnSettings {
        const columnSettings = new InMemoryAdaptedRevgridBehavioredColumnSettings(gridSettings);
        // columnSettings.merge(defaultAdaptedRevgridColumnSettings); // default is existing grid settings
        return columnSettings;
    }

    export function createSettingsServicePartialGridSettings(settingsService: SettingsService) {
        const gridSettings: Partial<AdaptedRevgridGridSettings> = {};
        const scalar = settingsService.scalar;
        const color = settingsService.color;

        // scrollbarHorizontalThumbHeight,
        // scrollbarVerticalThumbWidth,
        // scrollbarThumbInactiveOpacity,
        // const scrollbarMargin = core.grid_ScrollbarMargin;
        const fontFamily = scalar.grid_FontFamily;
        if (fontFamily !== '') {
            const fontSize = scalar.grid_FontSize;
            if (fontSize !== '') {
                const font = fontSize + ' ' + fontFamily;
                gridSettings.font = font;
            }

            const columnHeaderFontSize = scalar.grid_ColumnHeaderFontSize;
            if (columnHeaderFontSize !== '') {
                const font = columnHeaderFontSize + ' ' + fontFamily;
                gridSettings.columnHeaderFont = font;
                gridSettings.filterFont = font;
            }
        }

        gridSettings.defaultRowHeight = scalar.grid_RowHeight;
        // gridSettings.cellPadding = core.grid_CellPadding;

        const horizontalLinesVisible = scalar.grid_HorizontalLinesVisible;
        gridSettings.horizontalGridLinesVisible = horizontalLinesVisible;
        if (horizontalLinesVisible) {
            gridSettings.horizontalGridLinesWidth = scalar.grid_HorizontalLineWidth;
        } else {
            gridSettings.horizontalGridLinesWidth = 0;
        }

        const verticalLinesVisible = scalar.grid_VerticalLinesVisible;
        gridSettings.verticalGridLinesVisible = verticalLinesVisible;
        if (verticalLinesVisible) {
            const verticalLinesVisibleInHeaderOnly = scalar.grid_VerticalLinesVisibleInHeaderOnly;
            gridSettings.visibleVerticalGridLinesDrawnInFixedAndPreMainOnly = verticalLinesVisibleInHeaderOnly;

            gridSettings.verticalGridLinesWidth = scalar.grid_VerticalLineWidth;
        } else {
            gridSettings.verticalGridLinesWidth = 0;
        }

        gridSettings.scrollHorizontallySmoothly = scalar.grid_ScrollHorizontallySmoothly;

        const backgroundColor = color.getBkgd(ColorScheme.ItemId.Grid_Base);
        gridSettings.backgroundColor = backgroundColor;
        const rowStripeBackgroundColor = color.getBkgd(ColorScheme.ItemId.Grid_BaseAlt);
        gridSettings.rowStripeBackgroundColor = (rowStripeBackgroundColor === backgroundColor) ? undefined : rowStripeBackgroundColor;
        gridSettings.color = color.getFore(ColorScheme.ItemId.Grid_Base);
        // const columnHeaderBackgroundColor = color.getBkgd(ColorScheme.ItemId.Grid_ColumnHeader);
        // gridSettings.columnHeaderBackgroundColor = columnHeaderBackgroundColor;
        // const columnHeaderForegroundColor = color.getFore(ColorScheme.ItemId.Grid_ColumnHeader);
        // gridSettings.columnHeaderForegroundColor = columnHeaderForegroundColor;
        // gridSettings.focusedRowBackgroundColor = color.getBkgd(ColorScheme.ItemId.Grid_FocusedCell);
        // gridSettings.columnHeaderSelectionBackgroundColor = columnHeaderBackgroundColor;
        // gridSettings.columnHeaderSelectionForegroundColor = columnHeaderForegroundColor;
        // gridSettings.cellFocusedBorderColor = color.getFore(ColorScheme.ItemId.Grid_FocusedCellBorder);
        const horizontalGridLinesColor = color.getFore(ColorScheme.ItemId.Grid_HorizontalLine);
        gridSettings.horizontalGridLinesColor = horizontalGridLinesColor;
        gridSettings.horizontalFixedLineColor = horizontalGridLinesColor;
        const verticalGridLinesColor = color.getFore(ColorScheme.ItemId.Grid_VerticalLine);
        gridSettings.verticalGridLinesColor = verticalGridLinesColor;
        gridSettings.verticalFixedLineColor = verticalGridLinesColor;
        // uncomment below when row stripes are working
        // const bkgdBaseAlt = color.getBkgd(ColorScheme.ItemId.Grid_BaseAlt);
        // properties.rowStripes = [
        //     {
        //         backgroundColor: bkgdBase,
        //     },
        //     {
        //         backgroundColor: bkgdBaseAlt,
        //     }
        // ];

        return gridSettings;
    }
}
