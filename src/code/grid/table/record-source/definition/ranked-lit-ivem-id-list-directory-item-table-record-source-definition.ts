/**
 * %license Motif
 * (c) 2021 Paritech Wealth Technology
 * License: motionite.trade/license/motif
 */

import { RankedLitIvemIdListDirectory } from '../../../../ranked-lit-ivem-id-list/ranked-lit-ivem-id-list-internal-api';
import { RankedLitIvemIdListDirectoryItem } from '../../../../services/services-internal-api';
import { PickEnum } from '../../../../sys/sys-internal-api';
import { GridFieldCustomHeadingsService } from '../../../field/grid-field-internal-api';
import { GridLayoutDefinition } from '../../../layout/grid-layout-internal-api';
import { TableFieldSourceDefinition, TableFieldSourceDefinitionRegistryService } from '../../field-source/grid-table-field-source-internal-api';
import { TableRecordSourceDefinition } from './table-record-source-definition';

/** @public */
export class RankedLitIvemIdListDirectoryItemTableRecordSourceDefinition extends TableRecordSourceDefinition {
    constructor(
        customHeadingsService: GridFieldCustomHeadingsService,
        tableFieldSourceDefinitionRegistryService: TableFieldSourceDefinitionRegistryService,
        readonly listDirectory: RankedLitIvemIdListDirectory,
    ) {
        super(
            customHeadingsService,
            tableFieldSourceDefinitionRegistryService,
            TableRecordSourceDefinition.TypeId.RankedLitIvemIdListDirectoryItem,
            RankedLitIvemIdListDirectoryItemTableRecordSourceDefinition.allowedFieldSourceDefinitionTypeIds,
        );
    }

    override createDefaultLayoutDefinition() {
        const rankedLitIvemIdListDirectoryItemFieldSourceDefinition = this.fieldSourceDefinitionRegistryService.rankedLitIvemIdListDirectoryItem;

        const fieldNames = new Array<string>();

        fieldNames.push(rankedLitIvemIdListDirectoryItemFieldSourceDefinition.getSupportedFieldNameById(RankedLitIvemIdListDirectoryItem.FieldId.Name));
        fieldNames.push(rankedLitIvemIdListDirectoryItemFieldSourceDefinition.getSupportedFieldNameById(RankedLitIvemIdListDirectoryItem.FieldId.TypeId));

        return GridLayoutDefinition.createFromFieldNames(fieldNames);
    }
}

/** @public */
export namespace RankedLitIvemIdListDirectoryItemTableRecordSourceDefinition {
    export type FieldSourceDefinitionTypeId = PickEnum<TableFieldSourceDefinition.TypeId,
        TableFieldSourceDefinition.TypeId.RankedLitIvemIdListDirectoryItem
    >;

    export const allowedFieldSourceDefinitionTypeIds: FieldSourceDefinitionTypeId[] = [
        TableFieldSourceDefinition.TypeId.RankedLitIvemIdListDirectoryItem,
    ];

    export const defaultFieldSourceDefinitionTypeIds: FieldSourceDefinitionTypeId[] = [
        TableFieldSourceDefinition.TypeId.RankedLitIvemIdListDirectoryItem,
    ];
}
