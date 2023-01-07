/**
 * %license Motif
 * (c) 2021 Paritech Wealth Technology
 * License: motionite.trade/license/motif
 */

import { DayTradesDataItem, MovementId, TradeFlagId } from '../../adi/adi-internal-api';
import { StringId, Strings } from '../../res/res-internal-api';
import {
    DayTradesDataItemRecordTypeIdRenderValue,
    IntegerRenderValue,
    MarketIdRenderValue,
    OrderSideIdRenderValue,
    PriceRenderValue,
    RenderValue,
    SourceTzOffsetDateTimeTimeRenderValue,
    StringArrayRenderValue,
    StringRenderValue,
    TradeAffectsIdArrayRenderValue,
    TradeFlagIdArrayRenderValue,
    TrendIdRenderValue
} from '../../services/services-internal-api';
import {
    compareArray,
    compareNumber,
    compareUndefinableDecimal,
    compareUndefinableEnum,
    compareUndefinableInteger,
    compareUndefinableString,
    ComparisonResult,
    CorrectnessId,
    GridFieldHAlign,
    GridRevRecordField,
    Integer,
    SourceTzOffsetDateTime,
    UnreachableCaseError
} from "../../sys/sys-internal-api";
import { GridField, GridFieldDefinition, GridFieldSourceDefinition } from '../field/grid-field-internal-api';

/** @public */
export abstract class DayTradesGridField extends GridField implements GridRevRecordField {
    constructor(
        private readonly _id: DayTradesDataItem.Field.Id,
        heading: string,
        hAlign: GridFieldHAlign,
        private readonly _getDataItemCorrectnessIdEvent: DayTradesGridField.GetDataItemCorrectnessIdEventHandler,
    ) {
        const definition = new GridFieldDefinition(
            DayTradesDataItem.Field.idToName(_id),
            DayTradesGridField.sourceDefinition,
            heading,
            hAlign,
        );
        super(definition);
    }

    get isBrokerPrivateData() { return DayTradesDataItem.Field.idToIsBrokerPrivateData(this._id); }

    override getValue(record: DayTradesDataItem.Record): RenderValue {
        const { renderValue, cellAttribute } = this.createRenderValue(record);

        // add attributes in correct priority order.  1st will be applied last (highest priority)
        const correctnessId = this._getDataItemCorrectnessIdEvent();
        switch (correctnessId) {
            case CorrectnessId.Suspect:
                renderValue.addAttribute(RenderValue.DataCorrectnessAttribute.suspect);
                break;
            case CorrectnessId.Error:
                renderValue.addAttribute(RenderValue.DataCorrectnessAttribute.error);
                break;
            case CorrectnessId.Usable:
            case CorrectnessId.Good:
                // can do other attributes if usable
                if (cellAttribute !== undefined) {
                    renderValue.addAttribute(cellAttribute);
                }

                switch (record.typeId) {
                    case DayTradesDataItem.Record.TypeId.Cancelled:
                        renderValue.addAttribute(RenderValue.cancelledAttribute);
                        break;
                    case DayTradesDataItem.Record.TypeId.Canceller:
                        renderValue.addAttribute(RenderValue.cancellerAttribute);
                        break;
                }

                const tradeRecord = record.tradeRecord;

                if (tradeRecord.buyCrossRef !== undefined || tradeRecord.sellCrossRef !== undefined) {
                    renderValue.addAttribute(RenderValue.ownOrderAttribute);
                } else {
                    // const buyOrderId = tradeRecord.buyDepthOrderId;
                    // const sellOrderId = tradeRecord.sellDepthOrderId;
                    // const sideId = tradeRecord.orderSideId;

                    // if (sideId !== undefined) {
                    //     if (buyOrderId !== undefined || sellOrderId !== undefined) {
                    //         renderValue.addAttribute(RenderValue.ownOrderAttribute);
                    //     }
                    // }
                }

                break;

            default:
                throw new UnreachableCaseError('TGFGFV229988', correctnessId);
        }


        return renderValue;
    }

    compare(left: DayTradesDataItem.Record, right: DayTradesDataItem.Record) {
        return this.compareValue(left, right, true);
    }

    compareDesc(left: DayTradesDataItem.Record, right: DayTradesDataItem.Record) {
        return this.compareValue(right, left, false);
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    protected addRenderAttributes(renderValue: RenderValue, record: DayTradesDataItem.Record, cellAttribute: RenderValue.Attribute) {

    }

    protected abstract createRenderValue(record: DayTradesDataItem.Record): DayTradesGridField.CreateRenderValueResult;
    protected abstract compareValue(left: DayTradesDataItem.Record, right: DayTradesDataItem.Record, ascending: boolean): number;
}

/** @public */
export namespace DayTradesGridField {
    export type Id = DayTradesDataItem.Field.Id;
    export const idCount = DayTradesDataItem.Field.idCount;
    export type GetDataItemCorrectnessIdEventHandler = (this: void) => CorrectnessId;

    export class SourceDefinition extends GridFieldSourceDefinition {
    }

    export const sourceDefinition = new SourceDefinition('DayTrades');

    export interface CreateRenderValueResult {
        renderValue: RenderValue;
        cellAttribute: RenderValue.Attribute | undefined;
    }

    export function createField(id: Id,
        getDataItemCorrectnessIdEventHandler: GetDataItemCorrectnessIdEventHandler
    ): DayTradesGridField {
        switch (id) {
            case DayTradesDataItem.Field.Id.Id:
                return new IdDayTradesGridField(getDataItemCorrectnessIdEventHandler);
            case DayTradesDataItem.Field.Id.Price:
                return new PriceDayTradesGridField(getDataItemCorrectnessIdEventHandler);
            case DayTradesDataItem.Field.Id.Quantity:
                return new QuantityDayTradesGridField(getDataItemCorrectnessIdEventHandler);
            case DayTradesDataItem.Field.Id.Time:
                return new TimeDayTradesGridField(getDataItemCorrectnessIdEventHandler);
            case DayTradesDataItem.Field.Id.FlagIds:
                return new FlagIdsDayTradesGridField(getDataItemCorrectnessIdEventHandler);
            case DayTradesDataItem.Field.Id.TrendId:
                return new TrendIdDayTradesGridField(getDataItemCorrectnessIdEventHandler);
            case DayTradesDataItem.Field.Id.OrderSideId:
                return new OrderSideIdDayTradesGridField(getDataItemCorrectnessIdEventHandler);
            case DayTradesDataItem.Field.Id.AffectsIds:
                return new AffectsIdsDayTradesGridField(getDataItemCorrectnessIdEventHandler);
            case DayTradesDataItem.Field.Id.ConditionCodes:
                return new ConditionCodesDayTradesGridField(getDataItemCorrectnessIdEventHandler);
            case DayTradesDataItem.Field.Id.BuyDepthOrderId:
                return new BuyDepthOrderIdDayTradesGridField(getDataItemCorrectnessIdEventHandler);
            case DayTradesDataItem.Field.Id.BuyBroker:
                return new BuyBrokerDayTradesGridField(getDataItemCorrectnessIdEventHandler);
            case DayTradesDataItem.Field.Id.BuyCrossRef:
                return new BuyCrossRefDayTradesGridField(getDataItemCorrectnessIdEventHandler);
            case DayTradesDataItem.Field.Id.SellDepthOrderId:
                return new SellDepthOrderIdDayTradesGridField(getDataItemCorrectnessIdEventHandler);
            case DayTradesDataItem.Field.Id.SellBroker:
                return new SellBrokerDayTradesGridField(getDataItemCorrectnessIdEventHandler);
            case DayTradesDataItem.Field.Id.SellCrossRef:
                return new SellCrossRefDayTradesGridField(getDataItemCorrectnessIdEventHandler);
            case DayTradesDataItem.Field.Id.MarketId:
                return new MarketIdDayTradesGridField(getDataItemCorrectnessIdEventHandler);
            case DayTradesDataItem.Field.Id.RelatedId:
                return new RelatedIdDayTradesGridField(getDataItemCorrectnessIdEventHandler);
            case DayTradesDataItem.Field.Id.Attributes:
                return new AttributesDayTradesGridField(getDataItemCorrectnessIdEventHandler);
            case DayTradesDataItem.Field.Id.RecordTypeId:
                return new RecordTypeDayTradesGridField(getDataItemCorrectnessIdEventHandler);
            default:
                throw new UnreachableCaseError('DTGFCF12934883446', id);
        }
    }
}

/** @internal */
export class IdDayTradesGridField extends DayTradesGridField {
    constructor(getDataItemCorrectnessIdEvent: DayTradesGridField.GetDataItemCorrectnessIdEventHandler) {
        super(
            DayTradesDataItem.Field.Id.Id,
            Strings[StringId.DayTradesGridHeading_Id],
            GridFieldHAlign.right,
            getDataItemCorrectnessIdEvent
        );
    }

    protected createRenderValue(record: DayTradesDataItem.Record) {
        const result: DayTradesGridField.CreateRenderValueResult = {
            renderValue: new IntegerRenderValue(record.tradeRecord.id),
            cellAttribute: undefined,
        };
        return result;
    }

    protected compareValue(left: DayTradesDataItem.Record, right: DayTradesDataItem.Record): ComparisonResult {
        return compareNumber(left.tradeRecord.id, right.tradeRecord.id);
    }
}

/** @internal */
export class PriceDayTradesGridField extends DayTradesGridField {
    constructor(getDataItemCorrectnessIdEvent: DayTradesGridField.GetDataItemCorrectnessIdEventHandler) {
        super(
            DayTradesDataItem.Field.Id.Price,
            Strings[StringId.DayTradesGridHeading_Price],
            GridFieldHAlign.right,
            getDataItemCorrectnessIdEvent
        );
    }

    protected createRenderValue(record: DayTradesDataItem.Record) {
        let cellAttribute: RenderValue.HigherLowerAttribute | undefined;
        switch (record.tradeRecord.trendId) {
            case MovementId.Up:
                cellAttribute = RenderValue.HigherLowerAttribute.higher;
                break;
            case MovementId.Down:
                cellAttribute = RenderValue.HigherLowerAttribute.lower;
                break;

            default:
                cellAttribute = undefined;
        }

        const result: DayTradesGridField.CreateRenderValueResult = {
            renderValue: new PriceRenderValue(record.tradeRecord.price),
            cellAttribute,
        };
        return result;
    }

    protected compareValue(left: DayTradesDataItem.Record, right: DayTradesDataItem.Record, ascending: boolean) {
        return compareUndefinableDecimal(left.tradeRecord.price, right.tradeRecord.price, !ascending);
    }
}

/** @internal */
export class QuantityDayTradesGridField extends DayTradesGridField {
    constructor(getDataItemCorrectnessIdEvent: DayTradesGridField.GetDataItemCorrectnessIdEventHandler) {
        super(
            DayTradesDataItem.Field.Id.Quantity,
            Strings[StringId.DayTradesGridHeading_Quantity],
            GridFieldHAlign.right,
            getDataItemCorrectnessIdEvent
        );
    }

    protected createRenderValue(record: DayTradesDataItem.Record) {
        let quantity: Integer | undefined;
        if (record.relatedRecord !== undefined && record.tradeRecord.flagIds.includes(TradeFlagId.Cancel)) {
            const tradeQuantity = record.relatedRecord.tradeRecord.quantity;
            if (tradeQuantity === undefined) {
                quantity = undefined;
            } else {
                quantity = -tradeQuantity;
            }
        } else {
            quantity = record.tradeRecord.quantity;
        }

        const result: DayTradesGridField.CreateRenderValueResult = {
            renderValue: new IntegerRenderValue(quantity),
            cellAttribute: undefined,
        };
        return result;
    }

    protected compareValue(left: DayTradesDataItem.Record, right: DayTradesDataItem.Record, ascending: boolean) {
        return compareUndefinableInteger(left.tradeRecord.quantity, right.tradeRecord.quantity, !ascending);
    }
}

/** @internal */
export class TimeDayTradesGridField extends DayTradesGridField {
    constructor(getDataItemCorrectnessIdEvent: DayTradesGridField.GetDataItemCorrectnessIdEventHandler) {
        super(
            DayTradesDataItem.Field.Id.Time,
            Strings[StringId.DayTradesGridHeading_Time],
            GridFieldHAlign.left,
            getDataItemCorrectnessIdEvent
        );
    }

    protected createRenderValue(record: DayTradesDataItem.Record) {
        const result: DayTradesGridField.CreateRenderValueResult = {
            renderValue: new SourceTzOffsetDateTimeTimeRenderValue(record.tradeRecord.time),
            cellAttribute: undefined,
        };
        return result;
    }

    protected compareValue(left: DayTradesDataItem.Record, right: DayTradesDataItem.Record, ascending: boolean) {
        return SourceTzOffsetDateTime.compareUndefinable(left.tradeRecord.time, right.tradeRecord.time, !ascending);
    }
}

/** @internal */
export class FlagIdsDayTradesGridField extends DayTradesGridField {
    constructor(getDataItemCorrectnessIdEvent: DayTradesGridField.GetDataItemCorrectnessIdEventHandler) {
        super(
            DayTradesDataItem.Field.Id.FlagIds,
            Strings[StringId.DayTradesGridHeading_FlagIds],
            GridFieldHAlign.left,
            getDataItemCorrectnessIdEvent
        );
    }

    protected createRenderValue(record: DayTradesDataItem.Record) {
        const result: DayTradesGridField.CreateRenderValueResult = {
            renderValue: new TradeFlagIdArrayRenderValue(record.tradeRecord.flagIds),
            cellAttribute: undefined,
        };
        return result;
    }

    protected compareValue(left: DayTradesDataItem.Record, right: DayTradesDataItem.Record, ascending: boolean) {
        return compareArray(left.tradeRecord.flagIds, right.tradeRecord.flagIds);
    }
}

/** @internal */
export class TrendIdDayTradesGridField extends DayTradesGridField {
    constructor(getDataItemCorrectnessIdEvent: DayTradesGridField.GetDataItemCorrectnessIdEventHandler) {
        super(
            DayTradesDataItem.Field.Id.TrendId,
            Strings[StringId.DayTradesGridHeading_TrendId],
            GridFieldHAlign.left,
            getDataItemCorrectnessIdEvent
        );
    }

    protected createRenderValue(record: DayTradesDataItem.Record) {
        const result: DayTradesGridField.CreateRenderValueResult = {
            renderValue: new TrendIdRenderValue(record.tradeRecord.trendId),
            cellAttribute: undefined,
        };
        return result;
    }

    protected compareValue(left: DayTradesDataItem.Record, right: DayTradesDataItem.Record, ascending: boolean) {
        return compareUndefinableInteger(left.tradeRecord.trendId, right.tradeRecord.trendId, !ascending);
    }
}

/** @internal */
export class OrderSideIdDayTradesGridField extends DayTradesGridField {
    constructor(getDataItemCorrectnessIdEvent: DayTradesGridField.GetDataItemCorrectnessIdEventHandler) {
        super(
            DayTradesDataItem.Field.Id.OrderSideId,
            Strings[StringId.DayTradesGridHeading_OrderSideId],
            GridFieldHAlign.right,
            getDataItemCorrectnessIdEvent
        );
    }

    protected createRenderValue(record: DayTradesDataItem.Record) {
        const result: DayTradesGridField.CreateRenderValueResult = {
            renderValue: new OrderSideIdRenderValue(record.tradeRecord.orderSideId),
            cellAttribute: undefined,
        };
        return result;
    }

    protected compareValue(left: DayTradesDataItem.Record, right: DayTradesDataItem.Record, ascending: boolean) {
        return compareUndefinableInteger(left.tradeRecord.orderSideId, right.tradeRecord.orderSideId, !ascending);
    }
}

/** @internal */
export class AffectsIdsDayTradesGridField extends DayTradesGridField {
    constructor(getDataItemCorrectnessIdEvent: DayTradesGridField.GetDataItemCorrectnessIdEventHandler) {
        super(
            DayTradesDataItem.Field.Id.AffectsIds,
            Strings[StringId.DayTradesGridHeading_AffectsIds],
            GridFieldHAlign.right,
            getDataItemCorrectnessIdEvent
        );
    }

    protected createRenderValue(record: DayTradesDataItem.Record) {
        const result: DayTradesGridField.CreateRenderValueResult = {
            renderValue: new TradeAffectsIdArrayRenderValue(record.tradeRecord.affectsIds),
            cellAttribute: undefined,
        };
        return result;
    }

    protected compareValue(left: DayTradesDataItem.Record, right: DayTradesDataItem.Record, ascending: boolean) {
        return compareArray(left.tradeRecord.affectsIds, right.tradeRecord.affectsIds);
    }
}

/** @internal */
export class ConditionCodesDayTradesGridField extends DayTradesGridField {
    constructor(getDataItemCorrectnessIdEvent: DayTradesGridField.GetDataItemCorrectnessIdEventHandler) {
        super(
            DayTradesDataItem.Field.Id.ConditionCodes,
            Strings[StringId.DayTradesGridHeading_ConditionCodes],
            GridFieldHAlign.right,
            getDataItemCorrectnessIdEvent
        );
    }

    protected createRenderValue(record: DayTradesDataItem.Record) {
        const result: DayTradesGridField.CreateRenderValueResult = {
            renderValue: new StringRenderValue(record.tradeRecord.conditionCodes),
            cellAttribute: undefined,
        };
        return result;
    }

    protected compareValue(left: DayTradesDataItem.Record, right: DayTradesDataItem.Record, ascending: boolean) {
        return compareUndefinableString(left.tradeRecord.conditionCodes, right.tradeRecord.conditionCodes, !ascending);
    }
}

/** @internal */
export class BuyDepthOrderIdDayTradesGridField extends DayTradesGridField {
    constructor(getDataItemCorrectnessIdEvent: DayTradesGridField.GetDataItemCorrectnessIdEventHandler) {
        super(
            DayTradesDataItem.Field.Id.BuyDepthOrderId,
            Strings[StringId.DayTradesGridHeading_BuyDepthOrderId],
            GridFieldHAlign.right,
            getDataItemCorrectnessIdEvent
        );
    }

    protected createRenderValue(record: DayTradesDataItem.Record) {
        const result: DayTradesGridField.CreateRenderValueResult = {
            renderValue: new StringRenderValue(record.tradeRecord.buyDepthOrderId),
            cellAttribute: undefined,
        };
        return result;
    }

    protected compareValue(left: DayTradesDataItem.Record, right: DayTradesDataItem.Record, ascending: boolean) {
        return compareUndefinableString(left.tradeRecord.buyDepthOrderId, right.tradeRecord.buyDepthOrderId, !ascending);
    }
}

/** @internal */
export class BuyBrokerDayTradesGridField extends DayTradesGridField {
    constructor(getDataItemCorrectnessIdEvent: DayTradesGridField.GetDataItemCorrectnessIdEventHandler) {
        super(
            DayTradesDataItem.Field.Id.BuyBroker,
            Strings[StringId.DayTradesGridHeading_BuyBroker],
            GridFieldHAlign.right,
            getDataItemCorrectnessIdEvent
        );
    }

    protected createRenderValue(record: DayTradesDataItem.Record) {
        const result: DayTradesGridField.CreateRenderValueResult = {
            renderValue: new StringRenderValue(record.tradeRecord.buyBroker),
            cellAttribute: undefined,
        };
        return result;
    }

    protected compareValue(left: DayTradesDataItem.Record, right: DayTradesDataItem.Record, ascending: boolean) {
        return compareUndefinableString(left.tradeRecord.buyBroker, right.tradeRecord.buyBroker, !ascending);
    }
}

/** @internal */
export class BuyCrossRefDayTradesGridField extends DayTradesGridField {
    constructor(getDataItemCorrectnessIdEvent: DayTradesGridField.GetDataItemCorrectnessIdEventHandler) {
        super(
            DayTradesDataItem.Field.Id.BuyCrossRef,
            Strings[StringId.DayTradesGridHeading_BuyCrossRef],
            GridFieldHAlign.right,
            getDataItemCorrectnessIdEvent
        );
    }

    protected createRenderValue(record: DayTradesDataItem.Record) {
        const result: DayTradesGridField.CreateRenderValueResult = {
            renderValue: new StringRenderValue(record.tradeRecord.buyCrossRef),
            cellAttribute: undefined,
        };
        return result;
    }

    protected compareValue(left: DayTradesDataItem.Record, right: DayTradesDataItem.Record, ascending: boolean) {
        return compareUndefinableString(left.tradeRecord.buyCrossRef, right.tradeRecord.buyCrossRef, !ascending);
    }
}

/** @internal */
export class SellDepthOrderIdDayTradesGridField extends DayTradesGridField {
    constructor(getDataItemCorrectnessIdEvent: DayTradesGridField.GetDataItemCorrectnessIdEventHandler) {
        super(
            DayTradesDataItem.Field.Id.SellDepthOrderId,
            Strings[StringId.DayTradesGridHeading_SellDepthOrderId],
            GridFieldHAlign.right,
            getDataItemCorrectnessIdEvent
        );
    }

    protected createRenderValue(record: DayTradesDataItem.Record) {
        const result: DayTradesGridField.CreateRenderValueResult = {
            renderValue: new StringRenderValue(record.tradeRecord.sellDepthOrderId),
            cellAttribute: undefined,
        };
        return result;
    }

    protected compareValue(left: DayTradesDataItem.Record, right: DayTradesDataItem.Record, ascending: boolean) {
        return compareUndefinableString(left.tradeRecord.sellDepthOrderId, right.tradeRecord.sellDepthOrderId, !ascending);
    }
}

/** @internal */
export class SellBrokerDayTradesGridField extends DayTradesGridField {
    constructor(getDataItemCorrectnessIdEvent: DayTradesGridField.GetDataItemCorrectnessIdEventHandler) {
        super(
            DayTradesDataItem.Field.Id.SellBroker,
            Strings[StringId.DayTradesGridHeading_SellBroker],
            GridFieldHAlign.right,
            getDataItemCorrectnessIdEvent
        );
    }

    protected createRenderValue(record: DayTradesDataItem.Record) {
        const result: DayTradesGridField.CreateRenderValueResult = {
            renderValue: new StringRenderValue(record.tradeRecord.sellBroker),
            cellAttribute: undefined,
        };
        return result;
    }

    protected compareValue(left: DayTradesDataItem.Record, right: DayTradesDataItem.Record, ascending: boolean) {
        return compareUndefinableString(left.tradeRecord.sellBroker, right.tradeRecord.sellBroker, !ascending);
    }
}

/** @internal */
export class SellCrossRefDayTradesGridField extends DayTradesGridField {
    constructor(getDataItemCorrectnessIdEvent: DayTradesGridField.GetDataItemCorrectnessIdEventHandler) {
        super(
            DayTradesDataItem.Field.Id.SellCrossRef,
            Strings[StringId.DayTradesGridHeading_SellCrossRef],
            GridFieldHAlign.right,
            getDataItemCorrectnessIdEvent
        );
    }

    protected createRenderValue(record: DayTradesDataItem.Record) {
        const result: DayTradesGridField.CreateRenderValueResult = {
            renderValue: new StringRenderValue(record.tradeRecord.sellCrossRef),
            cellAttribute: undefined,
        };
        return result;
    }

    protected compareValue(left: DayTradesDataItem.Record, right: DayTradesDataItem.Record, ascending: boolean) {
        return compareUndefinableString(left.tradeRecord.sellCrossRef, right.tradeRecord.sellCrossRef, !ascending);
    }
}

/** @internal */
export class MarketIdDayTradesGridField extends DayTradesGridField {
    constructor(getDataItemCorrectnessIdEvent: DayTradesGridField.GetDataItemCorrectnessIdEventHandler) {
        super(
            DayTradesDataItem.Field.Id.MarketId,
            Strings[StringId.DayTradesGridHeading_MarketId],
            GridFieldHAlign.right,
            getDataItemCorrectnessIdEvent
        );
    }

    protected createRenderValue(record: DayTradesDataItem.Record) {
        const result: DayTradesGridField.CreateRenderValueResult = {
            renderValue: new MarketIdRenderValue(record.tradeRecord.marketId),
            cellAttribute: undefined,
        };
        return result;
    }

    protected compareValue(left: DayTradesDataItem.Record, right: DayTradesDataItem.Record, ascending: boolean) {
        return compareUndefinableEnum(left.tradeRecord.marketId, right.tradeRecord.marketId, !ascending);
    }
}

/** @internal */
export class RelatedIdDayTradesGridField extends DayTradesGridField {
    constructor(getDataItemCorrectnessIdEvent: DayTradesGridField.GetDataItemCorrectnessIdEventHandler) {
        super(
            DayTradesDataItem.Field.Id.RelatedId,
            Strings[StringId.DayTradesGridHeading_RelatedId],
            GridFieldHAlign.right,
            getDataItemCorrectnessIdEvent
        );
    }

    protected createRenderValue(record: DayTradesDataItem.Record) {
        const result: DayTradesGridField.CreateRenderValueResult = {
            renderValue: new IntegerRenderValue(record.tradeRecord.relatedId),
            cellAttribute: undefined,
        };
        return result;
    }

    protected compareValue(left: DayTradesDataItem.Record, right: DayTradesDataItem.Record, ascending: boolean) {
        return compareUndefinableInteger(left.tradeRecord.relatedId, right.tradeRecord.relatedId, !ascending);
    }
}

/** @internal */
export class AttributesDayTradesGridField extends DayTradesGridField {
    constructor(getDataItemCorrectnessIdEvent: DayTradesGridField.GetDataItemCorrectnessIdEventHandler) {
        super(
            DayTradesDataItem.Field.Id.Attributes,
            Strings[StringId.DayTradesGridHeading_Attributes],
            GridFieldHAlign.right,
            getDataItemCorrectnessIdEvent
        );
    }

    protected createRenderValue(record: DayTradesDataItem.Record) {
        const result: DayTradesGridField.CreateRenderValueResult = {
            renderValue: new StringArrayRenderValue(record.tradeRecord.attributes),
            cellAttribute: undefined,
        };
        return result;
    }

    protected compareValue(left: DayTradesDataItem.Record, right: DayTradesDataItem.Record) {
        return compareArray(left.tradeRecord.attributes, right.tradeRecord.attributes);
    }
}

/** @internal */
export class RecordTypeDayTradesGridField extends DayTradesGridField {
    constructor(getDataItemCorrectnessIdEvent: DayTradesGridField.GetDataItemCorrectnessIdEventHandler) {
        super(
            DayTradesDataItem.Field.Id.RecordTypeId,
            Strings[StringId.DayTradesGridHeading_RecordType],
            GridFieldHAlign.right,
            getDataItemCorrectnessIdEvent
        );
    }

    protected createRenderValue(record: DayTradesDataItem.Record) {
        const result: DayTradesGridField.CreateRenderValueResult = {
            renderValue: new DayTradesDataItemRecordTypeIdRenderValue(record.typeId),
            cellAttribute: undefined,
        };
        return result;
    }

    protected compareValue(left: DayTradesDataItem.Record, right: DayTradesDataItem.Record) {
        return DayTradesDataItem.Record.Type.sortCompareId(left.typeId, right.typeId);
    }
}
