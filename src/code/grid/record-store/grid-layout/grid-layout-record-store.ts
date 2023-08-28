/**
 * %license Motif
 * (c) 2021 Paritech Wealth Technology
 * License: motionite.trade/license/motif
 */

import { IntegerRenderValue, RenderValue, StringRenderValue } from '../../../services/services-internal-api';
import {
    GridFieldHorizontalAlign,
    GridRecordFieldIndex,
    GridRecordIndex,
    GridRecordStore,
    GridRecordStoreRecordsEventers,
    GridRevRecordField
} from '../../../sys/grid-revgrid-types';
import { Integer, ValueRecentChangeTypeId } from '../../../sys/sys-internal-api';
import { GridField, GridFieldDefinition, GridFieldSourceDefinition } from '../../field/grid-field-internal-api';
import { GridLayout } from '../../layout/grid-layout-internal-api';

export class GridLayoutRecordStore implements GridRecordStore {
    private _layout: GridLayout;
    private _headersMap: GridLayoutRecordStore.FieldNameToHeaderMap;

    private _recordsEventers: GridRecordStoreRecordsEventers;

    get recordCount(): number {
        return this._layout.columnCount;
    }

    setRecordEventers(recordsEventers: GridRecordStoreRecordsEventers): void {
        this._recordsEventers = recordsEventers;
    }

    getLayout() {
        return this._layout;
    }

    setData(layoutWithHeadings: GridLayoutRecordStore.LayoutWithHeadersMap) {
        this._layout = layoutWithHeadings.layout;
        // this._layout.reindexColumns();
        this._headersMap = layoutWithHeadings.headersMap;
    }

    clearData() {
        const definition = this._layout.createDefinition();
        this._layout = new GridLayout(definition); // replace with empty one
        this._headersMap.clear();
    }

    createPositionField() {
        return new GridLayoutRecordStore.PositionField(this._layout);
    }
    createNameField() {
        return new GridLayoutRecordStore.NameField();
    }
    createHeadingField(headersMap: GridLayoutRecordStore.FieldNameToHeaderMap) {
        return new GridLayoutRecordStore.HeadingField(headersMap);
    }
    createVisibleField() {
        return new GridLayoutRecordStore.VisibleField();
    }
    createWidthField() {
        return new GridLayoutRecordStore.WidthField();
    }
    // createSortPriorityField() { return new GridLayoutRecordStore.SortPriorityField(); }
    // createSortAscendingField() { return new GridLayoutRecordStore.SortAscendingField(); }

    getRecord(index: GridRecordIndex) {
        // return this._layout.getRecord(index);
        return {
            index: 1,
        };
    }

    getRecords() {
        // return this._layout.getRecords();
        return [{
            index: 1,
        }];
    }

    // addFields(fields: readonly GridLayoutRecordStore.Field[]) {
    //     this._fieldsEventers.addFields(fields);
    // }

    recordsLoaded() {
        this._recordsEventers.recordsLoaded();
    }

    recordsInserted(recordIndex: GridRecordIndex, count: Integer) {
        this._recordsEventers.recordsInserted(recordIndex, count);
    }

    invalidateValue(fieldIndex: GridRecordFieldIndex, recordIndex: GridRecordIndex, valueRecentChangeTypeId?: ValueRecentChangeTypeId) {
        this._recordsEventers.invalidateValue(fieldIndex, recordIndex, valueRecentChangeTypeId);
    }
}

export namespace GridLayoutRecordStore {
    export type FieldNameToHeaderMap = Map<string, string | undefined>;

    export interface LayoutWithHeadersMap {
        layout: GridLayout;
        headersMap: FieldNameToHeaderMap;
    }

    export namespace FieldName {
        export const position = 'Position';
        export const name = 'Name';
        export const heading = 'Heading';
        export const visible = 'Visible';
        export const width = 'Width';
        export const sortPriority = 'Sort Priority';
        export const sortAscending = 'Sort Ascending';
    }

    export abstract class Field extends GridField implements GridRevRecordField {
        constructor(
            name: string,
            heading: string,
            hAlign: GridFieldHorizontalAlign,
        ) {
            const definition = new GridFieldDefinition(
                Field.sourceDefinition,
                name,
                heading,
                hAlign,
            );
            super(definition);
        }

        abstract override getViewValue(record: unknown /* GridLayout.Column */): RenderValue;
    }

    export namespace Field {
        export const sourceDefinition = new GridFieldSourceDefinition('GridLayout');
    }

    export class PositionField extends Field {
        constructor(private _layout: GridLayout) {
            super(
                FieldName.position,
                FieldName.position,
                GridFieldHorizontalAlign.right,
            );
        }

        getViewValue(record: GridLayout.Column): IntegerRenderValue {
            const index = this._layout.indexOfColumn(record);
            return new IntegerRenderValue(index);
        }
    }

    export class NameField extends Field {
        constructor() {
            super(
                FieldName.name,
                FieldName.name,
                GridFieldHorizontalAlign.left,
            );
        }

        getViewValue(record: GridLayout.Column): StringRenderValue {
            return new StringRenderValue(record.fieldName);
        }
    }

    export class HeadingField extends Field {
        constructor(private _headersMap: GridLayoutRecordStore.FieldNameToHeaderMap) {
            super(
                FieldName.heading,
                FieldName.heading,
                GridFieldHorizontalAlign.left,
            );
        }

        getViewValue(record: GridLayout.Column): StringRenderValue {
            const heading = this._headersMap.get(record.fieldName);
            return new StringRenderValue(heading === undefined ? record.fieldName : heading);
        }
    }

    export class VisibleField extends Field {
        constructor() {
            super(
                FieldName.visible,
                FieldName.visible,
                GridFieldHorizontalAlign.left,
            );
        }

        getViewValue(record: GridLayout.Column): StringRenderValue {
            return new StringRenderValue(record.visible ? 'Y' : '');
        }
    }

    export class WidthField extends Field {
        constructor() {
            super(
                FieldName.width,
                FieldName.width,
                GridFieldHorizontalAlign.right,
            );
        }

        getViewValue(record: GridLayout.Column): IntegerRenderValue {
            return new IntegerRenderValue(record.autoSizableWidth);
        }
    }

    // export class SortPriorityField extends Field {
    //     constructor() {
    //         super(
    //             FieldName.sortPriority,
    //             FieldName.sortPriority,
    //             GridHalignEnum.Right,
    //         );
    //     }

    //     getValue(record: GridLayout.Column): IntegerRenderValue {
    //         return new IntegerRenderValue(record.sortPriority);
    //     }
    // }

    // export class SortAscendingField extends Field {
    //     constructor() {
    //         super(
    //             FieldName.sortAscending,
    //             FieldName.sortAscending,
    //             GridHalignEnum.Right,
    //         );
    //     }

    //     getValue(record: GridLayout.Column): StringRenderValue {
    //         const sortAscending = record.sortAscending;
    //         let value: string | undefined;
    //         if (sortAscending === undefined) {
    //             value = undefined;
    //         } else {
    //             value = sortAscending ? '+' : '-';
    //         }
    //         return new StringRenderValue(value);
    //     }
    // }

    // export const StringGridFieldState: GridRecordFieldState = {
    //     header: undefined,
    //     width: undefined,
    //     alignment: 'left'
    // };
    // export const IntegerGridFieldState: GridRecordFieldState = {
    //     header: undefined,
    //     width: undefined,
    //     alignment: 'right'
    // };
}