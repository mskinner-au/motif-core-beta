/**
 * %license Motif
 * (c) 2021 Paritech Wealth Technology
 * License: motionite.trade/license/motif
 */

import { Decimal } from 'decimal.js-light';
import {
    CallOrPut,
    CallOrPutId,
    Currency,
    CurrencyId,
    DataEnvironment,
    DataEnvironmentId,
    DayTradesDataItem,
    DepthDirection,
    DepthDirectionId, ExchangeId,
    ExchangeInfo,
    ExerciseType,
    ExerciseTypeId,
    FeedClass,
    FeedClassId,
    FeedStatus,
    FeedStatusId,
    IvemClass,
    IvemClassId,
    IvemId,
    LitIvemId,
    MarketBoard,
    MarketBoardId,
    MarketId,
    MarketInfo,
    Movement,
    MovementId,
    MyxLitIvemAttributes,
    OrderExtendedSide,
    OrderExtendedSideId,
    OrderPriceUnitType,
    OrderPriceUnitTypeId,
    OrderRouteAlgorithm,
    OrderRouteAlgorithmId,
    OrderShortSellType,
    OrderShortSellTypeId,
    OrderSide,
    OrderSideId,
    OrderStatus,
    OrderTriggerType,
    OrderTriggerTypeId,
    OrderType,
    OrderTypeId,
    PublisherSubscriptionDataType,
    PublisherSubscriptionDataTypeId,
    RoutedIvemId, ScanStatus, ScanStatusId, ScanTargetType,
    ScanTargetTypeId,
    TimeInForce,
    TimeInForceId,
    TradeAffects,
    TradeAffectsId,
    TradeFlag,
    TradeFlagId,
    TradingState,
    TrailingStopLossOrderConditionType,
    TrailingStopLossOrderConditionTypeId
} from "../adi/adi-internal-api";
import { StringId, Strings } from '../res/res-internal-api';
import { Scan, ScanField } from '../scan/internal-api';
import {
    BigIntRenderValue,
    BooleanRenderValue,
    ColorSettings,
    CountAndXrefsRenderValue,
    DateRenderValue,
    DateTimeRenderValue,
    DecimalRenderValue,
    EnumRenderValue,
    IntegerArrayRenderValue,
    IntegerRenderValue,
    IvemIdRenderValue, LitIvemIdArrayRenderValue, LitIvemIdRenderValue, MarketIdArrayRenderValue,
    NumberRenderValue,
    OrderStatusAllowIdArrayRenderValue,
    OrderStatusReasonIdArrayRenderValue,
    PercentageRenderValue,
    PriceAndHasUndisclosedRenderValue,
    PriceOrRemainderAndHasUndisclosedRenderValue,
    PriceOrRemainderRenderValue,
    PriceRenderValue,
    RankedLitIvemIdListDirectoryItem,
    RenderValue,
    RoutedIvemIdRenderValue,
    ScalarSettings, SettingsService,
    SourceTzOffsetDateRenderValue,
    SourceTzOffsetDateTimeDateRenderValue,
    SourceTzOffsetDateTimeRenderValue,
    SourceTzOffsetDateTimeTimeRenderValue,
    StringArrayRenderValue,
    StringRenderValue,
    SymbolsService,
    TimeRenderValue,
    TradeAffectsIdArrayRenderValue,
    TradeFlagIdArrayRenderValue
} from '../services/services-internal-api';
import {
    CommaText,
    Integer,
    Logger,
    MultiEvent,
    PriceOrRemainder,
    SourceTzOffsetDate,
    SourceTzOffsetDateTime,
    UnreachableCaseError
} from '../sys/sys-internal-api';

/** @public */
export class TextFormatterService {
    private readonly _scalarSettings: ScalarSettings;
    private _settingsChangeSubscriptionId: MultiEvent.SubscriptionId;

    private _numberFormat: Intl.NumberFormat;
    private _percentageFormat: Intl.NumberFormat;
    private _integerFormat: Intl.NumberFormat;
    private _decimalFormat: Intl.NumberFormat;
    private _priceFormat: Intl.NumberFormat;
    private _dateFormat: Intl.DateTimeFormat;
    private _dateTimeFormat: Intl.DateTimeFormat;
    private _timeFormat: Intl.DateTimeFormat;

    private _dateTimeTimezoneModeId: SourceTzOffsetDateTime.TimezoneModeId;

    constructor(private readonly _symbolsService: SymbolsService, private readonly _settingsService: SettingsService) {
        this._scalarSettings = this._settingsService.scalar;
        this._settingsChangeSubscriptionId = this._settingsService.subscribeSettingsChangedEvent(() => { this.handleSettingsChangedEvent(); });
            globalThis.addEventListener('onlanguagechange', () => { this.handleLanguageChangeEvent(); }, false);
    }

    finalise() {
        globalThis.removeEventListener('onlanguagechange', () => { this.handleLanguageChangeEvent(); }, false);
        this._settingsService.unsubscribeSettingsChangedEvent(this._settingsChangeSubscriptionId);
    }

    formatUngroupedInteger(value: Integer) {
        return value.toString(10);
    }

    formatTrueFalseBoolean(value: boolean): string {
        return value ? Strings[StringId.True] : Strings[StringId.False];
    }

    formatEnabledBoolean(value: boolean): string {
        return value ? Strings[StringId.Enabled] : '';
    }

    formatReadonlyBoolean(value: boolean): string {
        return value ? Strings[StringId.Readonly] : '';
    }

    formatValidBoolean(value: boolean): string {
        return value ? Strings[StringId.Valid] : '';
    }

    formatModifiedBoolean(value: boolean): string {
        return value ? Strings[StringId.Modified] : '';
    }

    formatYesNoBoolean(value: boolean): string {
        return value ? Strings[StringId.Yes] : Strings[StringId.No];
    }

    formatRenderValue(renderValue: RenderValue) {
        if (renderValue.formattedText === undefined) {
            if (renderValue.isUndefined()) {
                renderValue.formattedText = '';
            } else {
                const text = this.formatDefinedRenderValue(renderValue);
                renderValue.formattedText = text;
            }
        }

        return renderValue.formattedText;
    }

    formatNumber(value: number) {
        return this._numberFormat.format(value);
    }

    formatPercentage(value: number) {
        return this._percentageFormat.format(value);
    }

    formatInteger(value: Integer) {
        return this._integerFormat.format(value);
    }

    formatBigInt(value: bigint) {
        return this._integerFormat.format(value);
    }

    formatDecimal(value: Decimal) {
        return this._decimalFormat.format(value.toNumber());
    }

    formatPrice(value: Decimal) {
        // TODO:MED How many decimal places to display?
        return this._priceFormat.format(value.toNumber());
    }

    formatPriceOrRemainder(value: PriceOrRemainder) {
        if (value === null) {
            return Strings[StringId.PriceRemainder];
        } else {
            return this.formatPrice(value);
        }
    }

    formatQuantity(value: Integer) {
        return this.formatInteger(value);
    }

    formatDate(value: Date) {
        return this._dateFormat.format(value);
    }

    formatDateTime(value: Date) {
        return this._dateTimeFormat.format(value);
    }

    formatTime(value: Date) {
        return this._timeFormat.format(value);
    }

    formatSourceTzOffsetDateTime(value: SourceTzOffsetDateTime) {
        const date = SourceTzOffsetDateTime.getTimezonedDate(value, this._dateTimeTimezoneModeId);
        return this._dateTimeFormat.format(date);
    }

    formatSourceTzOffsetDateTimeDate(value: SourceTzOffsetDateTime) {
        const date = SourceTzOffsetDateTime.getTimezonedDate(value, this._dateTimeTimezoneModeId);
        return this._dateFormat.format(date);
    }

    formatSourceTzOffsetDateTimeTime(value: SourceTzOffsetDateTime) {
        const date = SourceTzOffsetDateTime.getTimezonedDate(value, this._dateTimeTimezoneModeId);
        return this._timeFormat.format(date);
    }

    formatSourceTzOffsetDate(value: SourceTzOffsetDate) {
        const date = SourceTzOffsetDate.getUtcTimezonedDate(value); // is midnight in UTC
        return this._dateFormat.format(date);
    }

    formatIvemId(value: IvemId) {
        return this._symbolsService.ivemIdToDisplay(value);
    }

    formatLitIvemId(value: LitIvemId) {
        return this._symbolsService.litIvemIdToDisplay(value);
    }

    formatLitIvemIdArrayAsCommaText(value: readonly LitIvemId[]) {
        const count = value.length;
        const strArray = new Array<string>(count);
        for (let i = 0; i < count; i++) {
            strArray[i] = this._symbolsService.litIvemIdToDisplay(value[i]);
        }
        return this.formatStringArrayAsCommaText(strArray);
    }

    formatRoutedIvemId(value: RoutedIvemId) {
        return this._symbolsService.routedIvemIdToDisplay(value);
    }

    formatIsIndexBoolean(value: boolean) {
        if (value) {
            return Strings[StringId.Index];
        } else {
            return '';
        }
    }
    formatVisibleBoolean(value: boolean) {
        if (value) {
            return Strings[StringId.Visible];
        } else {
            return '';
        }
    }
    formatWritableBoolean(value: boolean) {
        if (value) {
            return Strings[StringId.Writable];
        } else {
            return '';
        }
    }
    formatUndisclosedBoolean(value: boolean) {
        if (value) {
            return Strings[StringId.Undisclosed];
        } else {
            return '';
        }
    }
    formatIsReadableBoolean(value: boolean) {
        if (value) {
            return '';
        } else {
            return 'X';
        }
    }
    formatPhysicalDeliveryBoolean(value: boolean) {
        if (value) {
            return Strings[StringId.Physical];
        } else {
            return '';
        }
    }
    formatMatchedBoolean(value: boolean) {
        if (value) {
            return Strings[StringId.Matched];
        } else {
            return '';
        }
    }

    formatTradingStateReasonId(value: TradingState.ReasonId) {
        return TradingState.Reason.idToDisplay(value);
    }
    formatMarketId(value: MarketId) {
        return MarketInfo.idToDisplay(value);
    }
    formatTrendId(value: MovementId) {
        return Movement.idToDisplay(value);
    }
    formatColorSettingsItemStateId(value: ColorSettings.ItemStateId) {
        switch (value) {
            case ColorSettings.ItemStateId.Never:
            case ColorSettings.ItemStateId.Inherit:
                return ColorSettings.ItemState.idToDisplay(value);
            case ColorSettings.ItemStateId.Value:
                return '';
            default:
                throw new UnreachableCaseError('TFFCSFISI19998', value);
        }
    }
    formatExerciseTypeId(value: ExerciseTypeId) {
        return ExerciseType.idToDisplay(value);
    }
    formatRankedLitIvemIdListDirectoryItemTypeId(value: RankedLitIvemIdListDirectoryItem.TypeId) {
        return RankedLitIvemIdListDirectoryItem.Type.idToDisplay(value);
    }
    formatExchangeId(value: ExchangeId) {
        return ExchangeInfo.idToAbbreviatedDisplay(value);
    }
    formatCallOrPutId(value: CallOrPutId) {
        return CallOrPut.idToDisplay(value);
    }
    formatMarketBoardId(value: MarketBoardId) {
        return MarketBoard.idToDisplay(value);
    }
    formatCurrencyId(value: CurrencyId) {
        return Currency.idToDisplay(value);
    }
    formatOrderSideId(value: OrderSideId) {
        return OrderSide.idToDisplay(value);
    }
    formatOrderExtendedSideId(value: OrderExtendedSideId) {
        return OrderExtendedSide.idToDisplay(value);
    }
    formatOrderTypeId(value: OrderTypeId) {
        return OrderType.idToDisplay(value);
    }
    formatTimeInForceId(value: TimeInForceId) {
        return TimeInForce.idToDisplay(value);
    }
    formatOrderShortSellTypeId(value: OrderShortSellTypeId) {
        return OrderShortSellType.idToDisplay(value);
    }
    formatOrderTriggerTypeId(value: OrderTriggerTypeId) {
        return OrderTriggerType.idToDisplay(value);
    }
    formatGridOrderTriggerTypeId(value: OrderTriggerTypeId) {
        return OrderTriggerType.idToGridDisplay(value);
    }
    formatTrailingStopLossOrderConditionTypeId(value: TrailingStopLossOrderConditionTypeId) {
        return TrailingStopLossOrderConditionType.idToDisplay(value);
    }
    formatOrderPriceUnitTypeId(value: OrderPriceUnitTypeId) {
        return OrderPriceUnitType.idToDisplay(value);
    }
    formatOrderRouteAlgorithmId(value: OrderRouteAlgorithmId) {
        return OrderRouteAlgorithm.idToDisplay(value);
    }
    formatDataEnvironmentId(value: DataEnvironmentId) {
        return DataEnvironment.idToDisplay(value);
    }
    formatFeedClassId(value: FeedClassId) {
        return FeedClass.idToDisplay(value);
    }
    formatFeedStatusId(value: FeedStatusId) {
        return FeedStatus.idToDisplay(value);
    }
    formatIvemClassId(value: IvemClassId) {
        return IvemClass.idToDisplay(value);
    }
    formatDepthDirectionId(value: DepthDirectionId) {
        return DepthDirection.idToDisplay(value);
    }
    formatMarketClassificationIdMyxLitIvemAttribute(value: MyxLitIvemAttributes.MarketClassificationId) {
        return MyxLitIvemAttributes.MarketClassification.idToDisplay(value);
    }
    formatDeliveryBasisIdMyxLitIvemAttribute(value: MyxLitIvemAttributes.DeliveryBasisId) {
        return MyxLitIvemAttributes.DeliveryBasis.idToDisplay(value);
    }
    formatDayTradesDataItemRecordTypeId(value: DayTradesDataItem.Record.TypeId) {
        return DayTradesDataItem.Record.Type.idToDisplay(value);
    }
    formatScanStatusId(value: ScanStatusId) {
        return ScanStatus.idToDisplay(value);
    }
    formatScanCriteriaTypeId(value: Scan.CriterionId) {
        return Scan.CriteriaType.idToDisplay(value);
    }
    formatScanTargetTypeId(value: ScanTargetTypeId) {
        return ScanTargetType.idToDisplay(value);
    }
    formatScanFieldBooleanOperationId(value: ScanField.BooleanOperationId) {
        return ScanField.BooleanOperation.idToDisplay(value);
    }

    formatStringArrayAsCommaText(value: readonly string[]) {
        return CommaText.fromStringArray(value);
    }
    formatIntegerArrayAsCommaText(value: readonly Integer[]) {
        const count = value.length;
        const strArray = new Array<string>(count);
        for (let i = 0; i < count; i++) {
            strArray[i] = this.formatUngroupedInteger(value[i]);
        }
        return this.formatStringArrayAsCommaText(strArray);
    }
    formatTradeAffectsIdArrayAsCommaText(value: readonly TradeAffectsId[]) {
        const count = value.length;
        const strArray = new Array<string>(count);
        for (let i = 0; i < count; i++) {
            strArray[i] = TradeAffects.idToDisplay(value[i]);
        }
        return this.formatStringArrayAsCommaText(strArray);
    }
    formatMarketBoardIdArrayAsCommaText(value: readonly MarketBoardId[]) {
        const count = value.length;
        const strArray = new Array<string>(count);
        for (let i = 0; i < count; i++) {
            strArray[i] = MarketBoard.idToDisplay(value[i]);
        }
        return this.formatStringArrayAsCommaText(strArray);
    }
    formatPublisherSubscriptionDataTypeIdArrayAsCommaText(value: readonly PublisherSubscriptionDataTypeId[]) {
        const count = value.length;
        const strArray = new Array<string>(count);
        for (let i = 0; i < count; i++) {
            strArray[i] = PublisherSubscriptionDataType.idToDisplay(value[i]);
        }
        return this.formatStringArrayAsCommaText(strArray);
    }
    formatShortSellTypeIdMyxLitIvemAttribute(value: readonly MyxLitIvemAttributes.ShortSellTypeId[]) {
        const count = value.length;
        const strArray = new Array<string>(count);
        for (let i = 0; i < count; i++) {
            strArray[i] = MyxLitIvemAttributes.ShortSellType.idToDisplay(value[i]);
        }
        return this.formatStringArrayAsCommaText(strArray);
    }
    formatTradeFlagIdArrayAsCommaText(value: readonly TradeFlagId[]) {
        const count = value.length;
        const strArray = new Array<string>(count);
        for (let i = 0; i < count; i++) {
            strArray[i] = TradeFlag.idToDisplay(value[i]);
        }
        return this.formatStringArrayAsCommaText(strArray);
    }
    formatTradingStateAllowIdArrayAsCommaText(value: TradingState.AllowIds) {
        const count = value.length;
        const strArray = new Array<string>(count);
        for (let i = 0; i < count; i++) {
            strArray[i] = TradingState.Allow.idToDisplay(value[i]);
        }
        return this.formatStringArrayAsCommaText(strArray);
    }
    formatMarketIdArrayAsCommaText(value: readonly MarketId[]) {
        const count = value.length;
        const strArray = new Array<string>(count);
        for (let i = 0; i < count; i++) {
            strArray[i] = MarketInfo.idToDisplay(value[i]);
        }
        return this.formatStringArrayAsCommaText(strArray);
    }
    formatOrderStatusAllowIdArrayAsCommaText(value: OrderStatus.AllowIds) {
        const count = value.length;
        const strArray = new Array<string>(count);
        for (let i = 0; i < count; i++) {
            strArray[i] = OrderStatus.Allow.idToDisplay(value[i]);
        }
        return this.formatStringArrayAsCommaText(strArray);
    }
    formatOrderStatusReasonIdArrayAsCommaText(value: OrderStatus.ReasonIds) {
        const count = value.length;
        const strArray = new Array<string>(count);
        for (let i = 0; i < count; i++) {
            strArray[i] = OrderStatus.Reason.idToDisplay(value[i]);
        }
        return this.formatStringArrayAsCommaText(strArray);
    }
    formatPriceAndHasUndisclosed(value: PriceAndHasUndisclosedRenderValue.DataType) {
        let result = this.formatPrice(value.price);
        if (value.hasUndisclosed) {
            result = TextFormatterService.UndisclosedPrefix + result;
        }
        return result;
    }
    formatPriceOrRemainderAndHasUndisclosed(value: PriceOrRemainderAndHasUndisclosedRenderValue.DataType) {
        let result = this.formatPriceOrRemainder(value.price);
        if (value.hasUndisclosed) {
            result = TextFormatterService.UndisclosedPrefix + result;
        }
        return result;
    }
    formatCountAndXrefs(value: CountAndXrefsRenderValue.DataType) {
        let result = this.formatInteger(value.count);
        const xrefCount = value.xrefs.length;
        if (xrefCount > 0) {
            result = '(' + this.formatInteger(xrefCount) + ') ' + result;
        }
        return result;
    }

    private handleSettingsChangedEvent() {
        this.applySettings();
    }

    private handleLanguageChangeEvent() {
        this.updateIntl();
    }

    private updateIntl() {
        let locale: string;
        const languages = navigator.languages;
        if (languages.length > 0) {
            locale = languages[0];
        } else {
            locale = navigator.language;
            if (locale.length === 0) {
                Logger.logError('Cannot get user\'s locale. Using browser\'s default locale');
                locale = 'default';
            }
        }
        this._numberFormat = new Intl.NumberFormat(locale, { useGrouping: this._scalarSettings.format_NumberGroupingActive });
        this._percentageFormat = new Intl.NumberFormat(locale, { useGrouping: this._scalarSettings.format_NumberGroupingActive });
        this._integerFormat = new Intl.NumberFormat(locale, { useGrouping: this._scalarSettings.format_NumberGroupingActive });
        this._decimalFormat = new Intl.NumberFormat(locale, { useGrouping: this._scalarSettings.format_NumberGroupingActive });
        this._priceFormat = new Intl.NumberFormat(locale, { useGrouping: this._scalarSettings.format_NumberGroupingActive,
            minimumFractionDigits: this._scalarSettings.format_MinimumPriceFractionDigitsCount
        });

        this._dateFormat = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'numeric', day: 'numeric' });
        const dateTimeOptions: Intl.DateTimeFormatOptions = {
            year: 'numeric', month: 'numeric', day: 'numeric',
            hour: 'numeric', minute: 'numeric', second: 'numeric',
            hour12: !this._scalarSettings.format_24Hour
        };
        this._dateTimeFormat = new Intl.DateTimeFormat(locale, dateTimeOptions);
        const timeOptions: Intl.DateTimeFormatOptions = {
            hour: 'numeric', minute: 'numeric', second: 'numeric',
            hour12: !this._scalarSettings.format_24Hour
        };
        this._timeFormat = new Intl.DateTimeFormat(locale, timeOptions);
    }

    private applySettings() {
        this.updateIntl();

        this._dateTimeTimezoneModeId = this._scalarSettings.format_DateTimeTimezoneModeId;
    }

    private formatDefinedRenderValue(renderValue: RenderValue) {
        switch (renderValue.typeId) {
            case RenderValue.TypeId.String:
                return (renderValue as StringRenderValue).definedData;
            case RenderValue.TypeId.Number:
                return this.formatNumber((renderValue as NumberRenderValue).definedData);
            case RenderValue.TypeId.Percentage:
                return this.formatPercentage((renderValue as PercentageRenderValue).definedData);
            case RenderValue.TypeId.Integer:
                return this.formatInteger((renderValue as IntegerRenderValue).definedData);
            case RenderValue.TypeId.BigInt:
                return this.formatBigInt((renderValue as BigIntRenderValue).definedData);
            case RenderValue.TypeId.Decimal:
                return this.formatDecimal((renderValue as DecimalRenderValue).definedData);
            case RenderValue.TypeId.Price:
                return this.formatPrice((renderValue as PriceRenderValue).definedData);
            case RenderValue.TypeId.PriceOrRemainder:
                return this.formatPriceOrRemainder((renderValue as PriceOrRemainderRenderValue).definedData);
            case RenderValue.TypeId.Date:
                return this.formatDate((renderValue as DateRenderValue).definedData);
            case RenderValue.TypeId.DateTime:
                return this.formatDateTime((renderValue as DateTimeRenderValue).definedData);
            case RenderValue.TypeId.Time:
                return this.formatTime((renderValue as TimeRenderValue).definedData);
            case RenderValue.TypeId.SourceTzOffsetDateTime:
                return this.formatSourceTzOffsetDateTime((renderValue as SourceTzOffsetDateTimeRenderValue).definedData);
            case RenderValue.TypeId.SourceTzOffsetDateTimeDate:
                return this.formatSourceTzOffsetDateTimeDate((renderValue as SourceTzOffsetDateTimeDateRenderValue).definedData);
            case RenderValue.TypeId.SourceTzOffsetDateTimeTime:
                return this.formatSourceTzOffsetDateTimeTime((renderValue as SourceTzOffsetDateTimeTimeRenderValue).definedData);
            case RenderValue.TypeId.SourceTzOffsetDate:
                return this.formatSourceTzOffsetDate((renderValue as SourceTzOffsetDateRenderValue).definedData);
            case RenderValue.TypeId.Color:
                return '';
            case RenderValue.TypeId.IvemId:
                return this.formatIvemId((renderValue as IvemIdRenderValue).definedData);
            case RenderValue.TypeId.LitIvemId:
                return this.formatLitIvemId((renderValue as LitIvemIdRenderValue).definedData);
            case RenderValue.TypeId.LitIvemIdArray:
                return this.formatLitIvemIdArrayAsCommaText((renderValue as LitIvemIdArrayRenderValue).definedData);
            case RenderValue.TypeId.RoutedIvemId:
                return this.formatRoutedIvemId((renderValue as RoutedIvemIdRenderValue).definedData);
            case RenderValue.TypeId.TrueFalse:
                return this.formatTrueFalseBoolean((renderValue as BooleanRenderValue).definedData);
            case RenderValue.TypeId.Enabled:
                return this.formatEnabledBoolean((renderValue as BooleanRenderValue).definedData);
            case RenderValue.TypeId.Readonly:
                return this.formatReadonlyBoolean((renderValue as BooleanRenderValue).definedData);
            case RenderValue.TypeId.Valid:
                return this.formatValidBoolean((renderValue as BooleanRenderValue).definedData);
            case RenderValue.TypeId.Modified:
                return this.formatModifiedBoolean((renderValue as BooleanRenderValue).definedData);
            case RenderValue.TypeId.IsIndex:
                return this.formatIsIndexBoolean((renderValue as BooleanRenderValue).definedData);
            case RenderValue.TypeId.Visible:
                return this.formatVisibleBoolean((renderValue as BooleanRenderValue).definedData);
            case RenderValue.TypeId.Writable:
                return this.formatWritableBoolean((renderValue as BooleanRenderValue).definedData);
            case RenderValue.TypeId.Undisclosed:
                return this.formatUndisclosedBoolean((renderValue as BooleanRenderValue).definedData);
            case RenderValue.TypeId.IsReadable:
                return this.formatIsReadableBoolean((renderValue as BooleanRenderValue).definedData);
            case RenderValue.TypeId.PhysicalDelivery:
                return this.formatPhysicalDeliveryBoolean((renderValue as BooleanRenderValue).definedData);
            case RenderValue.TypeId.Matched:
                return this.formatMatchedBoolean((renderValue as BooleanRenderValue).definedData);
            case RenderValue.TypeId.TradingStateReasonId:
                return this.formatTradingStateReasonId((renderValue as EnumRenderValue).definedData);
            case RenderValue.TypeId.MarketId:
                return this.formatMarketId((renderValue as EnumRenderValue).definedData);
            case RenderValue.TypeId.TrendId:
                return this.formatTrendId((renderValue as EnumRenderValue).definedData);
            case RenderValue.TypeId.ColorSettingsItemStateId:
                return this.formatColorSettingsItemStateId((renderValue as EnumRenderValue).definedData);
            case RenderValue.TypeId.ExerciseTypeId:
                return this.formatExerciseTypeId((renderValue as EnumRenderValue).definedData);
            case RenderValue.TypeId.RankedLitIvemIdListDirectoryItemTypeId:
                return this.formatRankedLitIvemIdListDirectoryItemTypeId((renderValue as EnumRenderValue).definedData);
            case RenderValue.TypeId.ExchangeId:
                return this.formatExchangeId((renderValue as EnumRenderValue).definedData);
            case RenderValue.TypeId.CallOrPutId:
                return this.formatCallOrPutId((renderValue as EnumRenderValue).definedData);
            case RenderValue.TypeId.MarketBoardId:
                return this.formatMarketBoardId((renderValue as EnumRenderValue).definedData);
            case RenderValue.TypeId.CurrencyId:
                return this.formatCurrencyId((renderValue as EnumRenderValue).definedData);
            case RenderValue.TypeId.OrderExtendedSideId:
                return this.formatOrderExtendedSideId((renderValue as EnumRenderValue).definedData);
            case RenderValue.TypeId.OrderSideId:
                return this.formatOrderSideId((renderValue as EnumRenderValue).definedData);
            case RenderValue.TypeId.EquityOrderTypeId:
                return this.formatOrderTypeId((renderValue as EnumRenderValue).definedData);
            case RenderValue.TypeId.TimeInForceId:
                return this.formatTimeInForceId((renderValue as EnumRenderValue).definedData);
            case RenderValue.TypeId.OrderShortSellTypeId:
                return this.formatOrderShortSellTypeId((renderValue as EnumRenderValue).definedData);
            case RenderValue.TypeId.OrderPriceUnitTypeId:
                return this.formatOrderPriceUnitTypeId((renderValue as EnumRenderValue).definedData);
            case RenderValue.TypeId.OrderRouteAlgorithmId:
                return this.formatOrderRouteAlgorithmId((renderValue as EnumRenderValue).definedData);
            case RenderValue.TypeId.OrderTriggerTypeId:
                return this.formatOrderTriggerTypeId((renderValue as EnumRenderValue).definedData);
            case RenderValue.TypeId.GridOrderTriggerTypeId:
                return this.formatGridOrderTriggerTypeId((renderValue as EnumRenderValue).definedData);
            case RenderValue.TypeId.TrailingStopLossOrderConditionTypeId:
                return this.formatTrailingStopLossOrderConditionTypeId((renderValue as EnumRenderValue).definedData);
            case RenderValue.TypeId.DataEnvironmentId:
                return this.formatDataEnvironmentId((renderValue as EnumRenderValue).definedData);
            case RenderValue.TypeId.FeedClassId:
                return this.formatFeedClassId((renderValue as EnumRenderValue).definedData);
            case RenderValue.TypeId.FeedStatusId:
                return this.formatFeedStatusId((renderValue as EnumRenderValue).definedData);
            case RenderValue.TypeId.IvemClassId:
                return this.formatIvemClassId((renderValue as EnumRenderValue).definedData);
            case RenderValue.TypeId.DepthDirectionId:
                return this.formatDepthDirectionId((renderValue as EnumRenderValue).definedData);
            case RenderValue.TypeId.MarketClassificationIdMyxLitIvemAttribute:
                return this.formatMarketClassificationIdMyxLitIvemAttribute((renderValue as EnumRenderValue).definedData);
            case RenderValue.TypeId.DeliveryBasisIdMyxLitIvemAttribute:
                return this.formatDeliveryBasisIdMyxLitIvemAttribute((renderValue as EnumRenderValue).definedData);
            case RenderValue.TypeId.DayTradesDataItemRecordTypeId:
                return this.formatDayTradesDataItemRecordTypeId((renderValue as EnumRenderValue).definedData);
            case RenderValue.TypeId.ScanStatusId:
                return this.formatScanStatusId((renderValue as EnumRenderValue).definedData);
            case RenderValue.TypeId.ScanCriteriaTypeId:
                return this.formatScanCriteriaTypeId((renderValue as EnumRenderValue).definedData);
            case RenderValue.TypeId.ScanTargetTypeId:
                return this.formatScanTargetTypeId((renderValue as EnumRenderValue).definedData);
            case RenderValue.TypeId.ScanFieldBooleanOperationId:
                return this.formatScanFieldBooleanOperationId((renderValue as EnumRenderValue).definedData);
            case RenderValue.TypeId.StringArray:
                return this.formatStringArrayAsCommaText((renderValue as StringArrayRenderValue).definedData);
            case RenderValue.TypeId.IntegerArray:
                return this.formatIntegerArrayAsCommaText((renderValue as IntegerArrayRenderValue).definedData);
            case RenderValue.TypeId.MarketBoardIdArray:
                return this.formatMarketBoardIdArrayAsCommaText((renderValue as IntegerArrayRenderValue).definedData);
            case RenderValue.TypeId.PublisherSubscriptionDataTypeIdArray:
                return this.formatPublisherSubscriptionDataTypeIdArrayAsCommaText((renderValue as IntegerArrayRenderValue).definedData);
            case RenderValue.TypeId.ShortSellTypeIdArrayMyxLitIvemAttribute:
                return this.formatShortSellTypeIdMyxLitIvemAttribute((renderValue as IntegerArrayRenderValue).definedData);
            case RenderValue.TypeId.TradeAffectsIdArray:
                return this.formatTradeAffectsIdArrayAsCommaText((renderValue as TradeAffectsIdArrayRenderValue).definedData);
            case RenderValue.TypeId.TradeFlagIdArray:
                return this.formatTradeFlagIdArrayAsCommaText((renderValue as TradeFlagIdArrayRenderValue).definedData);
            case RenderValue.TypeId.TradingStateAllowIdArray:
                return this.formatTradingStateAllowIdArrayAsCommaText((renderValue as MarketIdArrayRenderValue).definedData);
            case RenderValue.TypeId.MarketIdArray:
                return this.formatMarketIdArrayAsCommaText((renderValue as MarketIdArrayRenderValue).definedData);
            case RenderValue.TypeId.OrderStatusAllowIdArray:
                return this.formatOrderStatusAllowIdArrayAsCommaText((renderValue as OrderStatusAllowIdArrayRenderValue).definedData);
            case RenderValue.TypeId.OrderStatusReasonIdArray:
                return this.formatOrderStatusReasonIdArrayAsCommaText((renderValue as OrderStatusReasonIdArrayRenderValue).definedData);
            case RenderValue.TypeId.PriceAndHasUndisclosed:
                return this.formatPriceAndHasUndisclosed((renderValue as PriceAndHasUndisclosedRenderValue).definedData);
            case RenderValue.TypeId.PriceOrRemainderAndHasUndisclosed:
                return this.formatPriceOrRemainderAndHasUndisclosed(
                    (renderValue as PriceOrRemainderAndHasUndisclosedRenderValue).definedData
                );
            case RenderValue.TypeId.CountAndXrefs:
                return this.formatCountAndXrefs((renderValue as CountAndXrefsRenderValue).definedData);
            default:
                throw new UnreachableCaseError('TFFDRV28507', renderValue.typeId);
        }
    }
}

/** @public */
export namespace TextFormatterService {
    export const UndisclosedPrefix = 'U';
}
