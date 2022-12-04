/**
 * %license Motif
 * (c) 2021 Paritech Wealth Technology
 * License: motionite.trade/license/motif
 */

import { FieldDataType, FieldDataTypeId, Order } from '../../../../adi/adi-internal-api';
import { AssertInternalError, CommaText, Integer, UnreachableCaseError } from '../../../../sys/sys-internal-api';
import { GridFieldSourceDefinition } from '../../../field/grid-field-internal-api';
import {
    BooleanCorrectnessTableField,
    CorrectnessTableField,
    DecimalCorrectnessTableField,
    EnumCorrectnessTableField,
    IntegerArrayCorrectnessTableField,
    IntegerCorrectnessTableField,
    SourceTzOffsetDateTimeCorrectnessTableField,
    StringArrayCorrectnessTableField,
    StringCorrectnessTableField,
    TableFieldDefinition
} from '../../field/grid-table-field-internal-api';
import {
    CorrectnessTableValue,
    CurrencyIdCorrectnessTableValue,
    DataEnvironmentIdCorrectnessTableValue,
    DecimalCorrectnessTableValue,
    EquityOrderTypeIdCorrectnessTableValue,
    ExchangeIdCorrectnessTableValue,
    GridOrderTriggerTypeIdCorrectnessTableValue,
    IntegerCorrectnessTableValue,
    IvemClassIdCorrectnessTableValue,
    MarketBoardIdCorrectnessTableValue,
    MarketIdCorrectnessTableValue,
    OrderExtendedSideIdCorrectnessTableValue,
    OrderPriceUnitTypeIdCorrectnessTableValue,
    OrderRouteAlgorithmIdCorrectnessTableValue,
    OrderShortSellTypeIdCorrectnessTableValue,
    OrderSideIdCorrectnessTableValue,
    OrderStatusAllowIdArrayCorrectnessTableValue,
    OrderStatusReasonIdArrayCorrectnessTableValue,
    PhysicalDeliveryCorrectnessTableValue,
    PriceCorrectnessTableValue,
    SourceTzOffsetDateTimeDateCorrectnessTableValue,
    StringArrayCorrectnessTableValue,
    StringCorrectnessTableValue,
    TimeInForceIdCorrectnessTableValue
} from '../../value/grid-table-value-internal-api';
import { TableFieldCustomHeadingsService } from './table-field-custom-headings-service';
import { TableFieldSourceDefinition } from './table-field-source-definition';

export class OrderTableFieldSourceDefinition extends TableFieldSourceDefinition {
    override readonly fieldDefinitions: TableFieldDefinition[];

    constructor(customHeadingsService: TableFieldCustomHeadingsService) {
        super(
            customHeadingsService,
            TableFieldSourceDefinition.TypeId.OrdersDataItem,
            OrderTableFieldSourceDefinition.name,
        );

        this.fieldDefinitions = OrderTableFieldSourceDefinition.createFieldDefinitions(customHeadingsService, this);
    }

    isFieldSupported(id: Order.FieldId) {
        return OrderTableFieldSourceDefinition.Field.isIdSupported(id);
    }

    getFieldNameById(id: Order.FieldId) {
        const sourcelessFieldName = OrderTableFieldSourceDefinition.Field.getNameById(id);
        return CommaText.from2Values(this.name, sourcelessFieldName);
    }

    getSupportedFieldNameById(id: Order.FieldId) {
        if (!this.isFieldSupported(id)) {
            throw new AssertInternalError('OTFSDGSFNBI31299', Order.Field.idToName(id));
        } else {
            return this.getFieldNameById(id);
        }
    }
}

export namespace OrderTableFieldSourceDefinition {
    export type SourceName = typeof name;
    export const name = 'Odi';

    export namespace Field {
        const unsupportedIds: Order.FieldId[] = [];
        export const count = Order.Field.count - unsupportedIds.length;

        interface Info {
            readonly id: Order.FieldId;
            readonly fieldConstructor: CorrectnessTableField.Constructor;
            readonly valueConstructor: CorrectnessTableValue.Constructor;
        }

        const infos = new Array<Info>(count);
        const idFieldIndices = new Array<Integer>(Order.Field.count);

        function idToTableGridConstructors(id: Order.FieldId):
            TableFieldSourceDefinition.CorrectnessTableGridConstructors {
            switch (id) {
                case Order.FieldId.Id:
                    return [StringCorrectnessTableField, StringCorrectnessTableValue];
                case Order.FieldId.AccountId:
                    return [StringCorrectnessTableField, StringCorrectnessTableValue];
                case Order.FieldId.ExternalId:
                    return [StringCorrectnessTableField, StringCorrectnessTableValue];
                case Order.FieldId.DepthOrderId:
                    return [StringCorrectnessTableField, StringCorrectnessTableValue];
                case Order.FieldId.Status:
                    return [StringCorrectnessTableField, StringCorrectnessTableValue];
                case Order.FieldId.StatusAllowIds:
                    return [IntegerArrayCorrectnessTableField, OrderStatusAllowIdArrayCorrectnessTableValue];
                case Order.FieldId.StatusReasonIds:
                    return [IntegerArrayCorrectnessTableField, OrderStatusReasonIdArrayCorrectnessTableValue];
                case Order.FieldId.MarketId:
                    return [EnumCorrectnessTableField, MarketIdCorrectnessTableValue];
                case Order.FieldId.TradingMarket:
                    return [EnumCorrectnessTableField, MarketBoardIdCorrectnessTableValue];
                case Order.FieldId.CurrencyId:
                    return [EnumCorrectnessTableField, CurrencyIdCorrectnessTableValue];
                case Order.FieldId.EstimatedBrokerage:
                    return [DecimalCorrectnessTableField, PriceCorrectnessTableValue];
                case Order.FieldId.CurrentBrokerage:
                    return [DecimalCorrectnessTableField, PriceCorrectnessTableValue];
                case Order.FieldId.EstimatedTax:
                    return [DecimalCorrectnessTableField, PriceCorrectnessTableValue];
                case Order.FieldId.CurrentTax:
                    return [DecimalCorrectnessTableField, PriceCorrectnessTableValue];
                case Order.FieldId.CurrentValue:
                    return [DecimalCorrectnessTableField, DecimalCorrectnessTableValue];
                case Order.FieldId.CreatedDate:
                    // return [SourceTzOffsetDateTimeDataItemTableField, SourceTzOffsetDateTimeCorrectnessTableValue];
                    return [SourceTzOffsetDateTimeCorrectnessTableField, SourceTzOffsetDateTimeDateCorrectnessTableValue];
                case Order.FieldId.UpdatedDate:
                    // return [SourceTzOffsetDateTimeDataItemTableField, SourceTzOffsetDateTimeCorrectnessTableValue];
                    return [SourceTzOffsetDateTimeCorrectnessTableField, SourceTzOffsetDateTimeDateCorrectnessTableValue];
                case Order.FieldId.StyleId:
                    return [EnumCorrectnessTableField, IvemClassIdCorrectnessTableValue];
                case Order.FieldId.Children:
                    return [StringArrayCorrectnessTableField, StringArrayCorrectnessTableValue];
                case Order.FieldId.ExecutedQuantity:
                    return [IntegerCorrectnessTableField, IntegerCorrectnessTableValue];
                case Order.FieldId.AveragePrice:
                    return [DecimalCorrectnessTableField, PriceCorrectnessTableValue];
                case Order.FieldId.ExchangeId:
                    return [EnumCorrectnessTableField, ExchangeIdCorrectnessTableValue];
                case Order.FieldId.Code:
                    return [StringCorrectnessTableField, StringCorrectnessTableValue];
                case Order.FieldId.SideId:
                    return [EnumCorrectnessTableField, OrderSideIdCorrectnessTableValue];
                case Order.FieldId.ExtendedSideId:
                    return [EnumCorrectnessTableField, OrderExtendedSideIdCorrectnessTableValue];
                case Order.FieldId.BrokerageSchedule:
                    return [StringCorrectnessTableField, StringCorrectnessTableValue];
                case Order.FieldId.EquityOrderTypeId:
                    return [EnumCorrectnessTableField, EquityOrderTypeIdCorrectnessTableValue];
                case Order.FieldId.LimitPrice:
                    return [DecimalCorrectnessTableField, PriceCorrectnessTableValue];
                case Order.FieldId.Quantity:
                    return [IntegerCorrectnessTableField, IntegerCorrectnessTableValue];
                case Order.FieldId.HiddenQuantity:
                    return [IntegerCorrectnessTableField, IntegerCorrectnessTableValue];
                case Order.FieldId.MinimumQuantity:
                    return [IntegerCorrectnessTableField, IntegerCorrectnessTableValue];
                case Order.FieldId.TimeInForceId:
                    return [EnumCorrectnessTableField, TimeInForceIdCorrectnessTableValue];
                case Order.FieldId.ExpiryDate:
                    return [SourceTzOffsetDateTimeCorrectnessTableField, SourceTzOffsetDateTimeDateCorrectnessTableValue];
                case Order.FieldId.ShortSellTypeId:
                    return [EnumCorrectnessTableField, OrderShortSellTypeIdCorrectnessTableValue];
                case Order.FieldId.UnitTypeId:
                    return [EnumCorrectnessTableField, OrderPriceUnitTypeIdCorrectnessTableValue];
                case Order.FieldId.UnitAmount:
                    return [DecimalCorrectnessTableField, DecimalCorrectnessTableValue];
                case Order.FieldId.ManagedFundCurrency:
                    return [StringCorrectnessTableField, StringCorrectnessTableValue];
                case Order.FieldId.PhysicalDelivery:
                    return [BooleanCorrectnessTableField, PhysicalDeliveryCorrectnessTableValue];
                case Order.FieldId.RouteAlgorithmId:
                    return [EnumCorrectnessTableField, OrderRouteAlgorithmIdCorrectnessTableValue];
                case Order.FieldId.RouteMarketId:
                    return [EnumCorrectnessTableField, MarketIdCorrectnessTableValue];
                case Order.FieldId.TriggerTypeId:
                    return [EnumCorrectnessTableField, GridOrderTriggerTypeIdCorrectnessTableValue];
                case Order.FieldId.TriggerValue:
                    return [DecimalCorrectnessTableField, PriceCorrectnessTableValue];
                case Order.FieldId.TriggerExtraParams:
                    return [StringCorrectnessTableField, StringCorrectnessTableValue];
                case Order.FieldId.EnvironmentId:
                    return [EnumCorrectnessTableField, DataEnvironmentIdCorrectnessTableValue];

                default:
                    throw new UnreachableCaseError('OTFDSFITTGC10049334', id);
            }
        }

        export function getId(fieldIdx: Integer) {
            return infos[fieldIdx].id;
        }

        export function getName(fieldIdx: Integer) {
            return Order.Field.idToName(infos[fieldIdx].id);
        }

        export function getNameById(id: Order.FieldId) {
            return Order.Field.idToName(id);
        }

        export function getHeading(fieldIdx: Integer) {
            return Order.Field.idToHeading(infos[fieldIdx].id);
        }

        export function getDataTypeId(fieldIdx: Integer): FieldDataTypeId {
            return Order.Field.idToFieldDataTypeId(infos[fieldIdx].id);
        }

        export function getTableFieldConstructor(fieldIdx: Integer) {
            return infos[fieldIdx].fieldConstructor;
        }

        export function getTableValueConstructor(fieldIdx: Integer) {
            return infos[fieldIdx].valueConstructor;
        }

        export function indexOfId(id: Order.FieldId) {
            return idFieldIndices[id];
        }

        export function isIdSupported(id: Order.FieldId) {
            return !unsupportedIds.includes(id);
        }

        export function initialiseFieldStatic() {
            let fieldIdx = 0;
            for (let id = 0; id < Order.Field.count; id++) {
                if (unsupportedIds.includes(id)) {
                    idFieldIndices[id] = -1;
                } else {
                    idFieldIndices[id] = fieldIdx;

                    const [fieldConstructor, valueConstructor] = idToTableGridConstructors(id);
                    infos[fieldIdx++] = {
                        id,
                        fieldConstructor,
                        valueConstructor,
                    };
                }
            }
        }
    }

    export function initialiseStatic() {
        Field.initialiseFieldStatic();
    }

    export function createFieldDefinitions(
        customHeadingsService: TableFieldCustomHeadingsService,
        gridFieldSourceDefinition: GridFieldSourceDefinition
    ) {
        const result = new Array<TableFieldDefinition>(OrderTableFieldSourceDefinition.Field.count);
        let idx = 0;
        for (let fieldIdx = 0; fieldIdx < OrderTableFieldSourceDefinition.Field.count; fieldIdx++) {
            const sourcelessFieldName = OrderTableFieldSourceDefinition.Field.getName(fieldIdx);
            const fieldName = CommaText.from2Values(name, sourcelessFieldName);
            let heading: string;
            const customHeading = customHeadingsService.tryGetFieldHeading(fieldName, sourcelessFieldName);
            if (customHeading !== undefined) {
                heading = customHeading;
            } else {
                heading = OrderTableFieldSourceDefinition.Field.getHeading(fieldIdx);
            }

            const dataTypeId = OrderTableFieldSourceDefinition.Field.getDataTypeId(fieldIdx);
            const textAlign = FieldDataType.idIsNumber(dataTypeId) ? 'right' : 'left';
            const fieldConstructor = OrderTableFieldSourceDefinition.Field.getTableFieldConstructor(fieldIdx);
            const valueConstructor = OrderTableFieldSourceDefinition.Field.getTableValueConstructor(fieldIdx);

            result[idx++] = new TableFieldDefinition(
                fieldName,
                heading,
                textAlign,
                gridFieldSourceDefinition,
                sourcelessFieldName,
                fieldConstructor,
                valueConstructor,
            );
        }

        return result;
    }
}
