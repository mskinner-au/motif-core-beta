/**
 * %license Motif
 * (c) 2021 Paritech Wealth Technology
 * License: motionite.trade/license/motif
 */

import { AssertInternalError, Integer, LockOpenListItem, moveElementInArray, moveElementsInArray, MultiEvent, Ok, Result } from '../../sys/sys-internal-api';
import { GridLayoutDefinition } from './definition/grid-layout-definition-internal-api';

/**
 * Provides access to a saved layout for a Grid
 *
 * @public
 */
export class GridLayout {
    private readonly _columns = new Array<GridLayout.Column>(0);

    private _beginChangeCount = 0;
    private _changeInitiator: GridLayout.ChangeInitiator | undefined;
    private _changed = false;
    private _widthsChanged = false;

    private _changedMultiEvent = new MultiEvent<GridLayout.ChangedEventHandler>();
    private _widthsChangedMultiEvent = new MultiEvent<GridLayout.WidthsChangedEventHandler>();

    // open(_opener: LockOpenListItem.Opener, fieldNames: string[]) {
    //     const fieldCount = fieldNames.length;
    //     this._fields.length = fieldCount;
    //     for (let i = 0; i < fieldCount; i++) {
    //         const fieldName = fieldNames[i];
    //         const field = new GridLayout.Field(fieldName);
    //         this._fields[i] = field;
    //     }

    //     const maxColumnCount = this._definition.columnCount;
    //     const definitionColumns = this._definition.columns;
    //     let columnCount = 0;
    //     this._columns.length = maxColumnCount;
    //     for (let i = 0; i < maxColumnCount; i++) {
    //         const definitionColumn = definitionColumns[i];
    //         const definitionColumnName = definitionColumn.name;
    //         const foundField = this._fields.find((field) => field.name === definitionColumnName);
    //         if (foundField !== undefined) {
    //             this._columns[columnCount] = {
    //                 index: columnCount,
    //                 field: foundField,
    //                 visible: true
    //             }
    //             columnCount++;
    //         }
    //         this._columns.length = columnCount;
    //     }
    //     this._definitionListChangeSubscriptionId = this._definition.subscribeListChangeEvent(
    //         (listChangeTypeId, index, count) => this.handleDefinitionListChangeEvent(listChangeTypeId, index, count)
    //     );
    // }

    // close(opener: LockOpenListItem.Opener) {
    //     this._definition.unsubscribeListChangeEvent(this._definitionListChangeSubscriptionId);
    //     this._definitionListChangeSubscriptionId = undefined;
    // }

    constructor(definition?: GridLayoutDefinition) {
        if (definition !== undefined) {
            this.applyDefinition(GridLayout.forceChangeInitiator, definition);
        }
    }

    get columns(): readonly GridLayout.Column[] { return this._columns; }
    get columnCount(): number { return this._columns.length; }

    tryLock(_locker: LockOpenListItem.Locker): Result<void> {
        return new Ok(undefined); // nothing to lock
    }

    unlock(_locker: LockOpenListItem.Locker): void {
        // nothing to unlock
    }

    openLocked(_opener: LockOpenListItem.Opener): void {
        // nothing to do
    }

    closeLocked(_opener: LockOpenListItem.Opener): void {
        // nothing to do
    }

    beginChange(initiator: GridLayout.ChangeInitiator) {
        if (this._beginChangeCount++ === 0) {
            this._changeInitiator = initiator;
        } else {
            if (initiator !== this._changeInitiator) {
                throw new AssertInternalError('GLBC97117');
            }
        }
    }

    endChange() {
        if (--this._beginChangeCount === 0) {
            if (this._changed) {
                // set _changed, _widthsChanged false and _changeInitiator to undefined before notifying in case another change initiated during notify
                this._changed = false;
                this._widthsChanged = false;
                const initiator = this._changeInitiator;
                if (initiator === undefined) {
                    throw new AssertInternalError('GLECC97117');
                } else {
                    this._changeInitiator = undefined;
                    this.notifyChanged(initiator);
                }
            } else {
                if (this._widthsChanged) {
                    // set _widthsChanged false and _changeInitiator to undefined before notifying in case another change initiated during notify
                    this._widthsChanged = false;
                    const initiator = this._changeInitiator;
                    if (initiator === undefined) {
                        throw new AssertInternalError('GLECW97117');
                    } else {
                        this._changeInitiator = undefined;
                        this.notifyWidthsChanged(initiator);
                    }
                } else {
                    // todo
                }
            }
        }
    }

    createCopy(): GridLayout {
        const columns = this._columns;
        const count = this.columnCount;
        const copiedColumns = new Array<GridLayoutDefinition.Column>(count);
        for (let i = 0; i < count; i++) {
            const column = columns[i];
            const copiedColumn = GridLayoutDefinition.Column.createCopy(column);
            copiedColumns[i] = copiedColumn;
        }

        const definition = new GridLayoutDefinition(copiedColumns);

        const result = new GridLayout(definition);

        return result;
    }

    createDefinition(): GridLayoutDefinition {
        const definitionColumns = this.createDefinitionColumns();
        return new GridLayoutDefinition(definitionColumns);
    }

    applyDefinition(initiator: GridLayout.ChangeInitiator, definition: GridLayoutDefinition): void {
        this.setColumns(initiator, definition.columns);
    }

    setColumns(initiator: GridLayout.ChangeInitiator, columns: readonly GridLayout.Column[]) {
        const newCount = columns.length;
        const newColumns = new Array<GridLayout.Column>(newCount);
        for (let i = 0; i < newCount; i++) {
            const column = columns[i];
            newColumns[i] = GridLayout.Column.createCopy(column);
        }

        this.beginChange(initiator);
        const oldCount = this._columns.length;
        this._columns.splice(0, oldCount, ...newColumns);
        this._changed = true;
        this.endChange();
    }

    getColumn(columnIndex: number): GridLayout.Column {
        return this._columns[columnIndex];
    }

    indexOfColumn(column: GridLayout.Column) {
        return this._columns.indexOf(column);
    }

    indexOfColumnByFieldName(fieldName: string) {
        return this._columns.findIndex((column) => column.fieldName === fieldName);
    }

    findColumn(fieldName: string) {
        return this._columns.find((column) => column.fieldName === fieldName);
    }


    addColumn(initiator: GridLayout.ChangeInitiator, columnOrName: string | GridLayoutDefinition.Column) {
        this.addColumns(initiator, [columnOrName]);
    }

    addColumns(initiator: GridLayout.ChangeInitiator, columnsNames: (string | GridLayoutDefinition.Column)[]) {
        const index = this._columns.length;
        this.insertColumns(initiator, index, columnsNames);
    }

    insertColumns(initiator: GridLayout.ChangeInitiator, index: Integer, columnOrFieldNames: (string | GridLayoutDefinition.Column)[]) {
        this.beginChange(initiator);
        const insertCount = columnOrFieldNames.length;
        const insertColumns = new Array<GridLayoutDefinition.Column>(insertCount);
        for (let i = 0; i < insertCount; i++) {
            const columnOrFieldName = columnOrFieldNames[i];
            const column: GridLayout.Column = (typeof columnOrFieldName === 'string') ?
                { fieldName: columnOrFieldName, visible: undefined, autoSizableWidth: undefined } :
                columnOrFieldName;
            this._columns[i] = column;
        }
        this._columns.splice(index, 0, ...insertColumns);
        this._changed = true;
        this.endChange();
    }

    removeColumn(initiator: GridLayout.ChangeInitiator, index: Integer) {
        this.removeColumns(initiator, index, 1);
    }

    removeColumns(initiator: GridLayout.ChangeInitiator, index: Integer, count: Integer) {
        this.beginChange(initiator);
        this._columns.splice(index, count);
        this._changed = true;
        this.endChange();
    }

    clearColumns(initiator: GridLayout.ChangeInitiator) {
        if (this._columns.length > 0 ) {
            this.beginChange(initiator);
            this._columns.length = 0;
            this._changed = true;
            this.endChange();
        }
    }

    moveColumn(initiator: GridLayout.ChangeInitiator, fromColumnIndex: Integer, toColumnIndex: Integer): boolean {
        this.beginChange(initiator);
        let result: boolean;
        if (fromColumnIndex === toColumnIndex) {
            result = false;
        } else {
            moveElementInArray(this._columns, fromColumnIndex, toColumnIndex);
            this._changed = true;
            result = true;
        }
        this.endChange();

        return result;
    }

    moveColumns(initiator: GridLayout.ChangeInitiator, fromColumnIndex: Integer, toColumnIndex: Integer, count: Integer): boolean {
        this.beginChange(initiator);
        let result: boolean;
        if (fromColumnIndex === toColumnIndex || count === 0) {
            result = false;
        } else {
            moveElementsInArray(this._columns, fromColumnIndex, toColumnIndex, count);
            this._changed = true;
            result = true;
        }
        this.endChange();

        return result;
    }

    setColumnWidth(initiator: GridLayout.ChangeInitiator, fieldName: string, width: Integer | undefined) {
        const column = this.findColumn(fieldName);
        if (column === undefined) {
            throw new AssertInternalError('GLSCW48483', fieldName);
        } else {
            if (width !== column.autoSizableWidth) {
                this.beginChange(initiator);
                column.autoSizableWidth = width;
                this._widthsChanged = true;
                this.endChange();
            }
        }
    }

    // serialise(): GridLayout.SerialisedColumn[] {
    //     return this._Columns.map<GridLayout.SerialisedColumn>((column) => {
    //         const result: GridLayout.SerialisedColumn = {
    //             name: column.field.name, width: column.width, priority: column.sortPriority, ascending: column.sortAscending
    //         };

    //         if (!column.visible) {
    //             result.show = false;
    //         }

    //         return result;
    //     });
    // }

    // setFieldColumnsByFieldNames(fieldNames: string[]): void {
    //     for (let idx = 0; idx < fieldNames.length; idx++) {
    //         const field = this.getFieldByName(fieldNames[idx]);
    //         if (field !== undefined) {
    //             this.moveFieldColumn(field, idx);
    //         }
    //     }
    // }

    // setFieldColumnsByColumnIndices(columnIndices: number[]): void {
    //     for (let idx = 0; idx < columnIndices.length; idx++) {
    //         const columnIdx = columnIndices[idx];
    //         this.moveColumn(columnIdx, idx);
    //     }
    // }

    // setFieldWidthByFieldName(fieldName: string, width?: number): void {
    //     const columnIdx = this.getFieldColumnIndexByFieldName(fieldName);
    //     if (columnIdx !== undefined) {
    //         const column = this._columns[columnIdx];
    //         this.setFieldWidthByColumn(column, width);
    //     }
    // }

    // setFieldsVisible(fieldNames: string[], visible: boolean): void {
    //     for (let idx = 0; idx < fieldNames.length; idx++) {
    //         const columnIdx = this.getFieldColumnIndexByFieldName(fieldNames[idx]);
    //         if (columnIdx !== undefined) {
    //             this._columns[columnIdx].visible = visible;
    //         }
    //     }
    // }

    subscribeChangedEvent(handler: GridLayout.ChangedEventHandler): number {
        return this._changedMultiEvent.subscribe(handler);
    }

    unsubscribeChangedEvent(subscriptionId: MultiEvent.SubscriptionId): void {
        this._changedMultiEvent.unsubscribe(subscriptionId);
    }

    subscribeWidthsChangedEvent(handler: GridLayout.WidthsChangedEventHandler): number {
        return this._widthsChangedMultiEvent.subscribe(handler);
    }

    unsubscribeWidthsChangedEvent(subscriptionId: MultiEvent.SubscriptionId): void {
        this._widthsChangedMultiEvent.unsubscribe(subscriptionId);
    }

    protected createDefinitionColumns(): GridLayoutDefinition.Column[] {
        const count = this.columnCount;
        const definitionColumns = new Array<GridLayoutDefinition.Column>(count);
        for (let i = 0; i < count; i++) {
            const column = this._columns[i];
            const definitionColumn: GridLayoutDefinition.Column = {
                fieldName: column.fieldName,
                autoSizableWidth: column.autoSizableWidth,
                visible: column.visible,
            };

            definitionColumns[i] = definitionColumn;
        }

        return definitionColumns;
    }

    private notifyChanged(initiator: GridLayout.ChangeInitiator) {
        const handlers = this._changedMultiEvent.copyHandlers();
        for (const handler of handlers) {
            handler(initiator);
        }
    }

    private notifyWidthsChanged(initiator: GridLayout.ChangeInitiator) {
        const handlers = this._widthsChangedMultiEvent.copyHandlers();
        for (const handler of handlers) {
            handler(initiator);
        }
    }

    private setFieldWidthByColumn(column: GridLayout.Column, width?: number): void {
        if (width === undefined) {
            delete column.autoSizableWidth;
        } else {
            column.autoSizableWidth = width;
        }
    }

    // SetFieldVisible(field: TFieldIndex | GridLayout.Field, visible: boolean): void {
    //     this.columns[this.GetFieldColumnIndex(field)].Visible = visible;
    // }

    private setColumnVisibility(columnIndex: number, visible: boolean | undefined): void {
        this._columns[columnIndex].visible = visible;
    }

    // private moveFieldColumn(field: GridLayout.Field, columnIndex: number): void {
    //     const oldColumnIndex = this.getFieldColumnIndexByField(field);

    //     if (oldColumnIndex === undefined) {
    //         throw new GridLayoutError(ErrorCode.GridLayoutFieldDoesNotExist, field.name);
    //     }

    //     this.moveColumn(oldColumnIndex, columnIndex);
    // }

    // private indexOfColumnByFieldName(fieldName: string): number | undefined {
    //     const idx = this._columns.findIndex((column) => column.fieldName === fieldName);
    //     return idx < 0 ? undefined : idx;
    // }

    // /** Gets all visible columns */
    // private getVisibleColumns(): GridLayout.Column[] {
    //     return this._columns.filter(column => column.visible);
    // }

    // private setFieldWidthByField(field: GridLayout.Field, width?: number): void {
    //     const columnIdx = this.getFieldColumnIndexByField(field);
    //     const column = this._columns[columnIdx];
    //     this.setFieldWidthByColumn(column, width);
    // }

    // private setFieldWidthByFieldIndex(fieldIdx: GridRecordFieldIndex, width?: number): void {
    //     const columnIdx = this.getFieldColumnIndexByFieldIndex(fieldIdx);
    //     const column = this._columns[columnIdx];

    //     this.setFieldWidthByColumn(column, width);
    // }
}

/** @public */
export namespace GridLayout {
    export type ChangedEventHandler = (this: void, initiator: ChangeInitiator) => void;
    export type WidthsChangedEventHandler = (this: void, initiator: ChangeInitiator) => void;

    export interface Column {
        fieldName: string;
        visible: boolean | undefined; // only use if want to keep position in case want to make visible again in future
        autoSizableWidth: Integer | undefined;
    }

    export namespace Column {
        export function createCopy(column: Column): Column {
            return {
                fieldName: column.fieldName,
                visible: column.visible,
                autoSizableWidth: column.autoSizableWidth,
            };
        }
    }

    export interface ChangeInitiator {
        // just used to mark object initiating a change
    }

    export const forceChangeInitiator: ChangeInitiator = {
    };
}
