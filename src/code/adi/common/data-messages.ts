/**
 * %license Motif
 * (c) 2021 Paritech Wealth Technology
 * License: motionite.trade/license/motif
 */

import { Decimal } from 'decimal.js-light';
import {
    ComparableList,
    compareInteger,
    ComparisonResult,
    Guid,
    Integer,
    Logger,
    PriceOrRemainder,
    SourceTzOffsetDate,
    SourceTzOffsetDateTime,
    SysTick
} from '../../sys/sys-internal-api';
import { AdiPublisherSubscription } from './adi-publisher-subscription';
import {
    AuiChangeTypeId,
    AurcChangeTypeId,
    broadcastDataItemRequestNr,
    BrokerageAccountId,
    CallOrPutId,
    CurrencyId,
    DataEnvironmentId,
    DataItemId,
    DataMessageType,
    DataMessageTypeId,
    DepthDirectionId,
    ExchangeId,
    ExerciseTypeId,
    FeedId,
    FeedStatusId,
    IvemClassId,
    MarketBoardId,
    MarketId,
    MovementId,
    OrderId,
    OrderInstructionId,
    OrderPriceUnitTypeId,
    OrderRequestError,
    OrderRequestResultId,
    OrderShortSellTypeId,
    OrderSideId,
    OrderTypeId,
    PublisherSessionTerminatedReasonId,
    PublisherSubscriptionDataTypeId,
    ScanStatusId,
    ScanTargetTypeId,
    TimeInForceId,
    TradeAffectsId,
    TradeFlagId,
    TradingEnvironmentId,
    ZenithPublisherReconnectReasonId,
    ZenithPublisherStateId
} from './data-types';
import { ClearIrrcChange, InsertRemoveReplaceIrrcChange, InsertReplaceIrrcChange, IrrcChange, RemoveIrrcChange } from './irrc-change';
import { LitIvemAlternateCodes } from './lit-ivem-alternate-codes';
import { LitIvemAttributes } from './lit-ivem-attributes';
import { LitIvemId } from './lit-ivem-id';
import { OrderRoute } from './order-route';
import { OrderStatuses } from './order-status';
import { OrderTrigger } from './order-trigger';
import { ScanNotification } from './scan-types';
import { TmcLeg } from './tmc-leg';
import { TopShareholder } from './top-shareholder';
import { TradingStates } from './trading-state';
import { Transaction } from './transaction';
import { ZenithEncodedScanFormula } from './zenith-protocol/internal-api';

export abstract class DataMessage {
    dataItemRequestNr: number;
    dataItemId: DataItemId;

    constructor(private _typeId: DataMessageTypeId) {
    }

    public get typeId(): DataMessageTypeId { return this._typeId; }
}

export namespace DataMessage {
    export const typeIdCount = DataMessageType.idCount;

    export function isErrorPublisherSubscriptionDataMessage(message: DataMessage): message is ErrorPublisherSubscriptionDataMessage {
        return message.typeId === DataMessageTypeId.PublisherSubscription_Error;
    }
}

/** @public */
export class DataMessages extends ComparableList<DataMessage> {
    extractMessages(): DataMessages {
        const result = new DataMessages();
        result.take(this);
        return result;
    }

    extractMessagesOrUndefined(): DataMessages | undefined {
        return this.count > 0 ? this.extractMessages() : undefined;
    }

    take(msgs: DataMessages) {
        for (let idx = 0; idx < msgs.count; idx++) {
            this.add(msgs.getAt(idx));
        }
        msgs.clear();
    }
}

/*export class ZenithErrorDataMessage extends FeedErrorDataMessage {
    static readonly feedTypeId = FeedErrorDataMessage.FeedTypeId.Zenith;

    controller: string;
    topic: string;
    action: string;
    errors: string[];

    constructor(errorTypeId: FeedErrorDataMessage.ErrorTypeId) {
        super(FeedErrorDataMessage.FeedTypeId.Zenith, errorTypeId);
    }

    get asBadness() {
        const controllerTopic = this.controller + '/' + this.topic + ': ';
        const errorText = this.errors.join();
        const reasonExtra = controllerTopic + errorText;

        switch (this.errorTypeId) {
            case FeedErrorDataMessage.ErrorTypeId.ServerWarning:
                return {
                    reasonId: Badness.ReasonId.FeedServerWarning,
                    reasonExtra,
                    error: false,
                };
            case FeedErrorDataMessage.ErrorTypeId.ServerError:
                return {
                    reasonId: Badness.ReasonId.FeedServerError,
                    reasonExtra,
                    error: true,
                };
            case FeedErrorDataMessage.ErrorTypeId.RequestError:
                return {
                    reasonId: Badness.ReasonId.FeedRequestError,
                    reasonExtra,
                    error: true,
                };
            case FeedErrorDataMessage.ErrorTypeId.RequestTimeout:
                // not expected in this error message
                throw new AssertInternalError('DMZEDMAB787485322');
            default:
                throw new UnreachableCaseError('DMZEDMGAB455555023', this.errorTypeId);
        }
    }
}*/

export class BrokerageAccountsDataMessage extends DataMessage {
    static readonly typeId = DataMessageTypeId.BrokerageAccounts;

    accounts: BrokerageAccountsDataMessage.Accounts = [];

    constructor() {
        super(BrokerageAccountsDataMessage.typeId);
    }
}

export namespace BrokerageAccountsDataMessage {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    export interface Account {
        id: BrokerageAccountId;
        name: string | undefined;
        environmentId: TradingEnvironmentId;
        tradingFeedId: FeedId | undefined;
        feedStatusId: FeedStatusId;
        brokerCode: string | null | undefined;
        branchCode: string | null | undefined;
        advisorCode: string | null | undefined;
    }
    export type Accounts = readonly Account[];
}

export class TransactionsDataMessage extends DataMessage {
    static readonly typeId = DataMessageTypeId.Transactions;

    changes: TransactionsDataMessage.Change[] = [];

    constructor() {
        super(TransactionsDataMessage.typeId);
    }
}

export namespace TransactionsDataMessage {
    export interface Change {
        typeId: AuiChangeTypeId;
    }

    export interface InitialiseChange extends Change {
        typeId: AuiChangeTypeId.Initialise;
        accountId: BrokerageAccountId;
        envionmentId: TradingEnvironmentId;
    }

    export interface AddUpdateChange extends Change {
        transaction: Transaction;
    }

    export interface UpdateChange extends AddUpdateChange {
        typeId: AuiChangeTypeId.Update;
    }

    export interface AddChange extends AddUpdateChange {
        typeId: AuiChangeTypeId.Add;
    }

    export function isAddChange(change: Change): change is AddChange {
        return change.typeId === AuiChangeTypeId.Add;
    }

    export function isInitialiseChange(change: Change): change is InitialiseChange {
        return change.typeId === AuiChangeTypeId.Initialise;
    }
}

export class OrdersDataMessage extends DataMessage {
    static readonly typeId = DataMessageTypeId.Orders;

    changeRecords: OrdersDataMessage.ChangeRecord[] = [];

    constructor() {
        super(OrdersDataMessage.typeId);
    }
}

export namespace OrdersDataMessage {
    export interface ChangeRecord {
        typeId: AurcChangeTypeId;
        change: Change;
    }

    export class Change {
        accountId: BrokerageAccountId;
    }

    export class ClearAccountChange extends Change {
        // no extra fields
    }

    export class RemoveChange extends Change {
        id: OrderId;
    }

    export class AddUpdateChange extends Change {
        id: OrderId;
        externalId: string | undefined;
        depthOrderId: string | undefined;
        status: string;
        marketId: MarketId | undefined;
        marketBoardId: MarketBoardId | undefined;
        currencyId: CurrencyId | undefined;
        estimatedBrokerage: Decimal | undefined;
        currentBrokerage: Decimal | undefined;
        estimatedTax: Decimal | undefined;
        currentTax: Decimal | undefined;
        currentValue: Decimal;
        createdDate: SourceTzOffsetDateTime;
        updatedDate: SourceTzOffsetDateTime;
        children: string[] | undefined;
        executedQuantity: Integer;
        averagePrice: Decimal | null | undefined;
        // details
        styleId: IvemClassId;
        exchangeId: ExchangeId;
        environmentId: TradingEnvironmentId;
        code: string;
        sideId: OrderSideId;
        brokerageSchedule: string | undefined;
        instructionIds: OrderInstructionId[];
        // market details
        equityOrderTypeId: OrderTypeId;
        limitPrice: Decimal | undefined;
        quantity: Integer;
        hiddenQuantity: Integer | undefined;
        minimumQuantity: Integer | undefined;
        timeInForceId: TimeInForceId;
        expiryDate: SourceTzOffsetDateTime | undefined;
        shortSellTypeId: OrderShortSellTypeId | undefined;
        // managed fund details
        unitTypeId: OrderPriceUnitTypeId;
        unitAmount: Decimal;
        managedFundCurrency: string | undefined;
        physicalDelivery: boolean | undefined;
        // route
        route: OrderRoute;
        // condition
        trigger: OrderTrigger;
    }

    export class AddChange extends AddUpdateChange {
        // no extra fields
    }

    export class UpdateChange extends AddUpdateChange {
        // no extra fields
    }

    export function isAddChangeRecord(change: Change, typeId: AurcChangeTypeId): change is AddChange {
        return typeId === AurcChangeTypeId.Add;
    }
}

export class HoldingsDataMessage extends DataMessage {
    static readonly typeId = DataMessageTypeId.Holdings;

    holdingChangeRecords: readonly HoldingsDataMessage.ChangeRecord[] = [];

    constructor() {
        super(HoldingsDataMessage.typeId);
    }
}

export namespace HoldingsDataMessage {
    export interface ChangeRecord {
        typeId: AurcChangeTypeId;
        data: ChangeData;
    }

    export interface ChangeData {
    }

    export interface ClearChangeData extends ChangeData {
        environmentId: TradingEnvironmentId;
        accountId: BrokerageAccountId;
    }

    export interface RemoveChangeData extends ChangeData {
        environmentId: TradingEnvironmentId;
        accountId: BrokerageAccountId;
        exchangeId: ExchangeId;
        code: string;
    }

    export interface AddUpdateChangeData extends ChangeData {
        exchangeId: ExchangeId;
        environmentId: TradingEnvironmentId;
        code: string;
        accountId: BrokerageAccountId;
        styleId: IvemClassId;
        cost: Decimal;
        currencyId: CurrencyId | undefined;
    }

    export interface MarketChangeData extends AddUpdateChangeData {
        styleId: IvemClassId.Market;
        marketDetail: MarketChangeData.Detail;
    }

    export namespace MarketChangeData {
        export interface Detail {
            totalQuantity: Integer;
            totalAvailableQuantity: Integer;
            averagePrice: Decimal;
        }
    }

    export interface ManagedFundChangeData extends AddUpdateChangeData {
        styleId: IvemClassId.ManagedFund;
    }

    export function isClearChangeData(record: ChangeRecord, data: ChangeData): data is ClearChangeData {
        return record.typeId === AurcChangeTypeId.Clear;
    }

    export function isRemoveChangeData(record: ChangeRecord, data: ChangeData): data is RemoveChangeData {
        return record.typeId === AurcChangeTypeId.Remove;
    }

    export function isAddChangeData(record: ChangeRecord, data: ChangeData): data is AddUpdateChangeData {
        return record.typeId === AurcChangeTypeId.Add;
    }

    export function isUpdateChangeData(record: ChangeRecord, data: ChangeData): data is AddUpdateChangeData {
        return record.typeId === AurcChangeTypeId.Update;
    }

    export function isMarketChangeData(data: AddUpdateChangeData): data is MarketChangeData {
        return data.styleId === IvemClassId.Market;
    }
}

export class BalancesDataMessage extends DataMessage {
    static readonly typeId = DataMessageTypeId.Balances;

    changes: BalancesDataMessage.Changes = [];

    constructor() {
        super(BalancesDataMessage.typeId);
    }
}

export namespace BalancesDataMessage {
    export const enum ChangeTypeId {
        InitialiseAccount,
        AddUpdate,
    }

    export interface Change {
        typeId: ChangeTypeId;
        accountId: BrokerageAccountId;
        environmentId: TradingEnvironmentId;
    }

    export type Changes = readonly Change[];

    export interface InitialiseAccountChange extends Change {
        typeId: ChangeTypeId.InitialiseAccount;
    }

    export interface AddUpdateChange extends Change {
        typeId: ChangeTypeId.AddUpdate;
        currencyId: CurrencyId;
        balanceType: string;
        amount: Decimal;
    }

    export function isClearAccountChange(change: Change): change is InitialiseAccountChange {
        return change.typeId === ChangeTypeId.InitialiseAccount;
    }

    export function isAddUpdateChange(change: Change): change is AddUpdateChange {
        return change.typeId === ChangeTypeId.AddUpdate;
    }
}

export class TradesDataMessage extends DataMessage {
    static readonly typeId = DataMessageTypeId.Trades;

    changes: TradesDataMessage.Change[];

    constructor() {
        super(TradesDataMessage.typeId);
    }
}

export namespace TradesDataMessage {
    export interface Change {
        typeId: AuiChangeTypeId;
    }

    export interface InitialiseChange extends Change {
        typeId: AuiChangeTypeId.Initialise;
        mostRecentId: Integer;
    }

    export interface AddUpdateChange extends Change {
        id: Integer;
        price: Decimal | undefined;
        quantity: Integer | undefined;
        time: SourceTzOffsetDateTime | undefined;
        flagIds: readonly TradeFlagId[];
        trendId: MovementId | undefined;
        sideId: OrderSideId | undefined;
        affectsIds: readonly TradeAffectsId[];
        conditionCodes: string | undefined;
        buyDepthOrderId: string | undefined;   // Can be used to identify the order associated with this trade.
        buyBroker: string | undefined;
        buyCrossRef: string | undefined;
        sellDepthOrderId: string | undefined;  // Can be used to identify the order associated with this trade.
        sellBroker: string | undefined;
        sellCrossRef: string | undefined;
        marketId: MarketId | undefined;
        relatedId: Integer | undefined;
        readonly attributes: string[];
    }

    export namespace AddUpdateChange {
        export function compareId(left: AddUpdateChange, right: AddUpdateChange): ComparisonResult {
            return compareInteger(left.id, right.id);
        }
    }

    export interface AddChange extends AddUpdateChange {
        typeId: AuiChangeTypeId.Add;
    }

    export interface UpdateChange extends AddUpdateChange {
        typeId: AuiChangeTypeId.Update;
    }
}

export class SymbolsDataMessage extends DataMessage {
    static readonly typeId = DataMessageTypeId.Symbols;

    changes: SymbolsDataMessage.Change[] | undefined; // Undefined indicates a fatal server error for this part of the response

    constructor() {
        super(SymbolsDataMessage.typeId);
    }
}

export namespace SymbolsDataMessage {
    export interface Change {
        typeId: AurcChangeTypeId;
    }

    export interface ClearChange extends Change {
        typeId: AurcChangeTypeId.Clear;
    }

    export interface RemoveChange extends Change {
        typeId: AurcChangeTypeId.Remove;
        litIvemId: LitIvemId;
    }

    export interface AddUpdateChange extends Change {
        typeId: AurcChangeTypeId;
        litIvemId: LitIvemId;
        name: string | undefined;
        ivemClassId: IvemClassId;
        exchangeId: ExchangeId;
        subscriptionDataTypeIds: readonly PublisherSubscriptionDataTypeId[];
        tradingMarketIds: readonly MarketId[];
    }

    export interface UpdateChange extends AddUpdateChange {
        cfi: string | undefined; // can be undefined if Detail only
        depthDirectionId: DepthDirectionId | undefined | null;
        isIndex: boolean | undefined | null;
        expiryDate: SourceTzOffsetDate | undefined | null;
        strikePrice: Decimal | undefined | null;
        exerciseTypeId: ExerciseTypeId | undefined | null;
        callOrPutId: CallOrPutId | undefined | null;
        contractSize: Decimal | undefined | null;
        lotSize: Integer | undefined | null;
        alternateCodes: LitIvemAlternateCodes | undefined | null;
        attributes: LitIvemAttributes | undefined | null;
        tmcLegs: readonly TmcLeg[] | undefined | null;
        categories: readonly string[] | undefined | null;
    }

    export interface AddChange extends AddUpdateChange {
        cfi: string | undefined; // can be undefined if Detail only
        depthDirectionId: DepthDirectionId | undefined;
        isIndex: boolean | undefined;
        expiryDate: SourceTzOffsetDate | undefined;
        strikePrice: Decimal | undefined;
        exerciseTypeId: ExerciseTypeId | undefined;
        callOrPutId: CallOrPutId | undefined;
        contractSize: Decimal | undefined;
        lotSize: Integer | undefined;
        alternateCodes: LitIvemAlternateCodes | undefined;
        attributes: LitIvemAttributes | undefined;
        tmcLegs: readonly TmcLeg[] | undefined;
        categories: readonly string[] | undefined;
    }

    export function isAddUpdateChange(change: Change): change is AddUpdateChange {
        return change.typeId === AurcChangeTypeId.Add || change.typeId === AurcChangeTypeId.Update;
    }
}

export class TradingStatesDataMessage extends DataMessage {
    static readonly typeId = DataMessageTypeId.TradingStates;

    states: TradingStates | undefined; // Undefined indicates a fatal server error for this part of the response

    constructor() {
        super(TradingStatesDataMessage.typeId);
    }
}

export class FeedsDataMessage extends DataMessage {
    static readonly typeId = DataMessageTypeId.Feeds;

    feeds: FeedsDataMessage.Feeds;

    constructor() {
        super(FeedsDataMessage.typeId);
    }
}

export namespace FeedsDataMessage {
    export interface Feed {
        readonly id: FeedId;
        readonly statusId: FeedStatusId;
    }

    export interface DataFeed extends Feed {
        readonly environmentId: DataEnvironmentId | undefined;
    }

    export interface TradingFeed extends Feed {
        readonly environmentId: TradingEnvironmentId | undefined;
    }

    export type Feeds = readonly Feed[];
}

export class MarketsDataMessage extends DataMessage {
    static readonly typeId = DataMessageTypeId.Markets;

    markets: MarketsDataMessage.Markets;

    constructor() {
        super(MarketsDataMessage.typeId);
    }
}

export namespace MarketsDataMessage {
    export interface Market {
        readonly marketId: MarketId;
        readonly environmentId: DataEnvironmentId;
        readonly code: string;
        readonly feedStatusId: FeedStatusId;
        readonly tradingDate: SourceTzOffsetDate | undefined;
        readonly marketTime: SourceTzOffsetDateTime | undefined;
        readonly status: string | undefined;
        readonly tradingMarketBoards: TradingMarketBoards | undefined;
    }

    export type Markets = readonly Market[];

    export interface TradingMarketBoard {
        id: MarketBoardId;
        environmentId: DataEnvironmentId;
        status: string;
    }

    export type TradingMarketBoards = readonly TradingMarketBoard[];
}

export class DepthDataMessage extends DataMessage {
    static readonly typeId = DataMessageTypeId.Depth;

    orderChangeRecords: DepthDataMessage.ChangeRecords = [];

    constructor() {
        super(DepthDataMessage.typeId);
    }
}

export namespace DepthDataMessage {
    export interface ChangeRecord {
        o: 'A' | 'U' | 'R' | 'C';
        order: DepthOrder | undefined;
    }

    export interface DepthOrder {
        id: string;
        sideId: OrderSideId | undefined;
        price: Decimal | undefined;
        position: Integer | undefined;
        broker: string | undefined;
        crossRef: string | undefined;
        quantity: Integer | undefined;
        hasUndisclosed: boolean | undefined;
        marketId: MarketId | undefined;
        dataEnvironmentId: DataEnvironmentId | undefined;
        attributes: string[] | undefined;
    }

    export type ChangeRecords = ChangeRecord[];
}

export class DepthLevelsDataMessage extends DataMessage {
    static readonly typeId = DataMessageTypeId.DepthLevels;

    levelChangeRecords: DepthLevelsDataMessage.ChangeRecord[] = [];

    constructor() {
        super(DepthLevelsDataMessage.typeId);
    }
}

export namespace DepthLevelsDataMessage {
    export interface ChangeRecord {
        o: 'A' | 'U' | 'R' | 'C';
        level: Level | undefined;
    }

    export interface Level {
        id: string;
        sideId: OrderSideId | undefined;
        price: PriceOrRemainder | undefined;
        volume: Integer | undefined;
        orderCount: Integer | undefined;
        hasUndisclosed: boolean | undefined;
        marketId: MarketId | undefined;
    }
}

export class SecurityDataMessage extends DataMessage {
    static readonly typeId = DataMessageTypeId.Security;

    securityInfo: SecurityDataMessage.Rec;

    constructor() {
        super(SecurityDataMessage.typeId);
    }
}

export namespace SecurityDataMessage {
    export interface Rec {
        code: string | undefined;
        marketId: MarketId | undefined;
        exchangeId: ExchangeId | undefined;
        dataEnvironmentId: DataEnvironmentId | undefined;
        name: string | undefined;
        classId: IvemClassId | undefined;
        cfi: string | undefined;
        tradingState: string | undefined;
        marketIds: MarketId[] | undefined;
        isIndex: boolean | undefined;
        expiryDate: SourceTzOffsetDate | undefined;
        strikePrice: Decimal | undefined;
        callOrPutId: CallOrPutId | undefined;
        contractSize: Integer | undefined;
        subscriptionDataTypeIds: PublisherSubscriptionDataTypeId[] | undefined;
        quotationBasis: string | null | undefined;
        open: Decimal | null | undefined;
        high: Decimal | null | undefined;
        low: Decimal | null | undefined;
        close: Decimal | null | undefined;
        settlement: Decimal | null | undefined;
        last: Decimal | null | undefined;
        trend: MovementId | undefined;
        bestAsk: Decimal | null | undefined;
        askCount: Integer | undefined;
        askQuantity: Integer | undefined;
        askUndisclosed: boolean | undefined;
        bestBid: Decimal | null | undefined;
        bidCount: Integer | undefined;
        bidQuantity: Integer | undefined;
        bidUndisclosed: boolean | undefined;
        numberOfTrades: Integer | undefined;
        volume: Integer | undefined;
        auctionPrice: Decimal | null | undefined;
        auctionQuantity: Integer | null | undefined;
        auctionRemainder: Integer | null | undefined;
        vWAP: Decimal | null | undefined;
        valueTraded: number | undefined;
        openInterest: Integer | null | undefined;
        shareIssue: Integer | null | undefined;
        statusNote: string | null | undefined;
        extended: Extended | null | undefined;
    }

    export interface Extended {
        pss: Decimal | undefined;
        idss: Decimal | undefined;
        pdt: Decimal | undefined;
        rss: Decimal | undefined;
        high52: Decimal | undefined;
        low52: Decimal | undefined;
        reference: Decimal | undefined;
        highLimit: Decimal | undefined;
        lowLimit: Decimal | undefined;
    }
}

export class CreateScanDataMessage extends DataMessage {
    static readonly typeId = DataMessageTypeId.CreateScan;

    scanId: string;

    constructor() {
        super(CreateScanDataMessage.typeId);
    }
}

export class UpdateScanDataMessage extends DataMessage {
    static readonly typeId = DataMessageTypeId.UpdateScan;

    constructor() {
        super(UpdateScanDataMessage.typeId);
    }
}

export class DeleteScanDataMessage extends DataMessage {
    static readonly typeId = DataMessageTypeId.DeleteScan;

    constructor() {
        super(DeleteScanDataMessage.typeId);
    }
}

export class QueryScanDetailDataMessage extends DataMessage {
    static readonly typeId = DataMessageTypeId.QueryScanDetail;

    scanId: string;
    scanName: string;
    scanDescription: string | undefined;
    scanReadonly: boolean;
    scanStatusId: ScanStatusId;
    versionNumber: Integer | undefined;
    versionId: Guid | undefined;
    versioningInterrupted: boolean;
    lastSavedTime: Date | undefined;
    lastEditSessionId: Guid | undefined;
    symbolListEnabled: boolean | undefined;
    zenithCriteriaSource: string | undefined;
    zenithRankSource: string | undefined;
    zenithCriteria: ZenithEncodedScanFormula.BooleanTupleNode;
    zenithRank: ZenithEncodedScanFormula.NumericTupleNode | undefined;
    targetTypeId: ScanTargetTypeId;
    targetMarketIds: readonly MarketId[] | undefined;
    targetLitIvemIds: readonly LitIvemId[] | undefined;
    notifications: readonly ScanNotification[] | undefined;

    constructor() {
        super(QueryScanDetailDataMessage.typeId);
    }
}

export class ScanStatusedDescriptorsDataMessage extends DataMessage {
    static readonly typeId = DataMessageTypeId.ScanDescriptors;

    changes: ScanStatusedDescriptorsDataMessage.Change[];

    constructor() {
        super(ScanStatusedDescriptorsDataMessage.typeId);
    }
}

export namespace ScanStatusedDescriptorsDataMessage {
    export interface Change {
        typeId: AurcChangeTypeId;
    }

    export interface ClearChange extends Change {
        typeId: AurcChangeTypeId.Clear;
    }

    export interface RemoveChange extends Change {
        typeId: AurcChangeTypeId.Remove;
        scanId: string;
    }

    export interface AddUpdateChange extends Change {
        typeId: AurcChangeTypeId.Add | AurcChangeTypeId.Update;
        scanId: string;
        scanName: string | undefined;
        scanDescription: string | undefined;
        readonly: boolean | undefined;
        scanStatusId: ScanStatusId | undefined;
        versionNumber: Integer | undefined;
        versionId: Guid | undefined;
        versioningInterrupted: boolean;
        lastSavedTime: Date | undefined;
        lastEditSessionId: Guid | undefined;
        symbolListEnabled: boolean | undefined;
        zenithCriteriaSource: string | undefined;
        zenithRankSource: string | undefined;
    }

    export interface AddChange extends AddUpdateChange {
        typeId: AurcChangeTypeId.Add;
        scanId: string;
        scanName: string;
        scanDescription: string | undefined;
        readonly: boolean;
        scanStatusId: ScanStatusId;
        versionId: string | undefined;
        versioningInterrupted: boolean;
        lastSavedTime: Date | undefined;
        lastEditSessionId: Guid | undefined;
        symbolListEnabled: boolean | undefined;
        zenithCriteriaSource: string | undefined;
        zenithRankSource: string | undefined;
    }

    export interface UpdateChange extends AddUpdateChange {
        typeId: AurcChangeTypeId.Update;
    }

    export function isRemoveChange(change: Change): change is RemoveChange {
        return change.typeId === AurcChangeTypeId.Remove;
    }

    export function isAddUpdateChange(change: Change): change is AddUpdateChange {
        return change.typeId === AurcChangeTypeId.Add || change.typeId === AurcChangeTypeId.Update;
    }

    export function isAddChange(change: Change): change is AddChange {
        return change.typeId === AurcChangeTypeId.Add;
    }

    export function isUpdateChange(change: Change): change is UpdateChange {
        return change.typeId === AurcChangeTypeId.Update;
    }
}

export class MatchesDataMessage<T> extends DataMessage {
    changes: MatchesDataMessage.Change<T>[];
}

export namespace MatchesDataMessage {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    export interface Change<T> {
        typeId: AurcChangeTypeId;
    }

    export interface ClearChange<T> extends Change<T> {
        typeId: AurcChangeTypeId.Clear;
    }

    export interface AddUpdateRemoveChange<T> extends Change<T> {
        key: string;
        value: T;
    }

    export interface RemoveChange<T> extends AddUpdateRemoveChange<T> {
    }

    export interface AddUpdateChange<T> extends AddUpdateRemoveChange<T> {
        rankScore: number;
    }

    export function isAddUpdateChange<T>(change: Change<T>): change is AddUpdateChange<T> {
        return change.typeId === AurcChangeTypeId.Add || change.typeId === AurcChangeTypeId.Update;
    }

    export function isRemoveChange<T>(change: Change<T>): change is RemoveChange<T> {
        return change.typeId === AurcChangeTypeId.Remove;
    }
}

export class LitIvemIdMatchesDataMessage extends MatchesDataMessage<LitIvemIdMatchesDataMessage.RecordType> {
    static readonly typeId = DataMessageTypeId.LitIvemIdMatches;

    constructor() {
        super(LitIvemIdMatchesDataMessage.typeId);
    }
}

export namespace LitIvemIdMatchesDataMessage {
    export type RecordType = LitIvemId;
    export type Change = MatchesDataMessage.Change<RecordType>;
    export type ClearChange = MatchesDataMessage.ClearChange<RecordType>;
    export type AddUpdateRemoveChange = MatchesDataMessage.AddUpdateRemoveChange<RecordType>;
    export type RemoveChange = MatchesDataMessage.RemoveChange<RecordType>;
    export type AddUpdateChange = MatchesDataMessage.AddUpdateChange<RecordType>;
}

export class WatchmakerListRequestAcknowledgeDataMessage extends DataMessage {
    static readonly typeId = DataMessageTypeId.WatchmakerListRequestAcknowledge;

    constructor() {
        super(WatchmakerListRequestAcknowledgeDataMessage.typeId);
    }
}

export class CreateOrCopyWatchmakerListDataMessage extends DataMessage {
    static readonly typeId = DataMessageTypeId.CreateOrCopyWatchmakerList;

    listId: string;

    constructor() {
        super(CreateOrCopyWatchmakerListDataMessage.typeId);
    }
}

export class WatchmakerListDescriptorsDataMessage extends DataMessage {
    static readonly typeId = DataMessageTypeId.WatchmakerListDescriptors;

    changes: WatchmakerListDescriptorsDataMessage.Change[];

    constructor() {
        super(WatchmakerListDescriptorsDataMessage.typeId);
    }
}

export namespace WatchmakerListDescriptorsDataMessage {
    export interface Change {
        typeId: AurcChangeTypeId;
    }

    export interface ClearChange extends Change {
        typeId: AurcChangeTypeId.Clear;
    }

    export interface AddUpdateRemoveChange extends Change {
        id: string;
    }

    export interface RemoveChange extends AddUpdateRemoveChange {
        typeId: AurcChangeTypeId.Remove;
    }

    export interface AddUpdateChange extends AddUpdateRemoveChange {
        typeId: AurcChangeTypeId.Add | AurcChangeTypeId.Update;
        name: string;
        description: string | undefined;
        category: string | undefined;
        isWritable: boolean;
    }

    export function isAddUpdateRemoveChange(change: Change): change is AddUpdateRemoveChange {
        return change.typeId !== AurcChangeTypeId.Clear;
    }

    export function isRemoveChange(change: Change): change is RemoveChange {
        return change.typeId === AurcChangeTypeId.Remove;
    }

    export function isAddUpdateChange(change: Change): change is AddUpdateChange {
        return change.typeId === AurcChangeTypeId.Add || change.typeId === AurcChangeTypeId.Update;
    }
}

export class WatchmakerListLitIvemIdsDataMessage extends DataMessage {
    static readonly typeId = DataMessageTypeId.WatchmakerListLitIvemIds;

    changes: WatchmakerListLitIvemIdsDataMessage.Change[];

    constructor() {
        super(WatchmakerListLitIvemIdsDataMessage.typeId);
    }
}

export namespace WatchmakerListLitIvemIdsDataMessage {
    export type RecordType = LitIvemId;
    export type Change = IrrcChange<RecordType>;
    export type ClearChange = ClearIrrcChange<RecordType>;
    export type InsertRemoveReplaceChange = InsertRemoveReplaceIrrcChange<RecordType>;
    export type RemoveChange = RemoveIrrcChange<RecordType>;
    export type InsertReplaceChange = InsertReplaceIrrcChange<RecordType>;
}

export class TLowLevelTopShareholdersDataMessage extends DataMessage {
    static readonly typeId = DataMessageTypeId.TopShareholders;

    topShareholdersInfo: TopShareholder[];

    constructor() {
        super(TLowLevelTopShareholdersDataMessage.typeId);
    }
}

export abstract class OrderResponseDataMessage extends DataMessage {
    result: OrderRequestResultId;
    order: OrdersDataMessage.AddUpdateChange | undefined;
    errors: OrderRequestError[] | undefined;
}

export class PlaceOrderResponseDataMessage extends OrderResponseDataMessage {
    static readonly typeId = DataMessageTypeId.PlaceOrderResponse;

    estimatedBrokerage: Decimal | undefined;
    estimatedTax: Decimal | undefined;
    estimatedValue: Decimal | undefined;

    constructor() {
        super(PlaceOrderResponseDataMessage.typeId);
    }
}

export class AmendOrderResponseDataMessage extends OrderResponseDataMessage {
    static readonly typeId = DataMessageTypeId.AmendOrderResponse;

    estimatedBrokerage: Decimal | undefined;
    estimatedTax: Decimal | undefined;
    estimatedValue: Decimal | undefined;

    constructor() {
        super(AmendOrderResponseDataMessage.typeId);
    }
}

export class CancelOrderResponseDataMessage extends OrderResponseDataMessage {
    static readonly typeId = DataMessageTypeId.CancelOrderResponse;

    constructor() {
        super(CancelOrderResponseDataMessage.typeId);
    }
}

export class MoveOrderResponseDataMessage extends OrderResponseDataMessage {
    static readonly typeId = DataMessageTypeId.MoveOrderResponse;

    constructor() {
        super(MoveOrderResponseDataMessage.typeId);
    }
}

export class OrderStatusesDataMessage extends DataMessage {
    static readonly typeId = DataMessageTypeId.OrderStatuses;

    statuses: OrderStatuses;

    constructor() {
        super(OrderStatusesDataMessage.typeId);
    }
}

export class ChartHistoryDataMessage extends DataMessage {
    static readonly typeId = DataMessageTypeId.ChartHistory;

    records: ChartHistoryDataMessage.Record[];

    constructor() {
        super(ChartHistoryDataMessage.typeId);
    }
}

export namespace ChartHistoryDataMessage {
    export interface Record {
        dateTime: SourceTzOffsetDateTime;
        open: number | undefined;
        high: number | undefined;
        low: number | undefined;
        close: number | undefined;
        volume: Integer | undefined;
        trades: Integer | undefined;
    }
}

export class ZenithServerInfoDataMessage extends DataMessage {
    static readonly typeId = DataMessageTypeId.ZenithServerInfo;

    serverName: string;
    serverClass: string;
    softwareVersion: string;
    protocolVersion: string;

    constructor() {
        super(ZenithServerInfoDataMessage.typeId);
    }
}

export class ZenithSessionTerminatedDataMessage extends DataMessage {
    static readonly typeId = DataMessageTypeId.ZenithSessionTerminated;

    reasonId: PublisherSessionTerminatedReasonId;
    reasonCode: Integer;
    defaultReasonText: string;

    constructor() {
        super(ZenithSessionTerminatedDataMessage.typeId);
    }
}

export class ZenithPublisherOnlineChangeDataMessage extends DataMessage {
    static readonly typeId = DataMessageTypeId.ZenithPublisherOnlineChange;

    online: boolean;
    socketCloseCode: number;
    socketCloseReason: string;
    socketCloseWasClean: boolean;

    constructor() {
        super(ZenithPublisherOnlineChangeDataMessage.typeId);
    }
}

export class ZenithPublisherStateChangeDataMessage extends DataMessage {
    static readonly typeId = DataMessageTypeId.ZenithPublisherStateChange;

    stateId: ZenithPublisherStateId;
    waitId: Integer;

    constructor() {
        super(ZenithPublisherStateChangeDataMessage.typeId);
    }
}

export class ZenithReconnectDataMessage extends DataMessage {
    static readonly typeId = DataMessageTypeId.ZenithReconnect;

    reconnectReasonId: ZenithPublisherReconnectReasonId;

    constructor() {
        super(ZenithReconnectDataMessage.typeId);
    }
}

export class ZenithEndpointSelectedDataMessage extends DataMessage {
    static readonly typeId = DataMessageTypeId.ZenithEndpointSelected;

    endpoint: string;

    constructor() {
        super(ZenithEndpointSelectedDataMessage.typeId);
    }
}

export class ZenithLogDataMessage extends DataMessage {
    static readonly typeId = DataMessageTypeId.ZenithLog;

    time: Date;
    levelId: Logger.LevelId;
    text: string;

    constructor() {
        super(ZenithLogDataMessage.typeId);
    }
}

export abstract class PublisherDataMessage extends DataMessage {
    constructor(typeId: DataMessageTypeId, dataItemId: DataItemId, dataItemRequestNr: Integer) {
        super(typeId);
        this.dataItemId = dataItemId;
        this.dataItemRequestNr = dataItemRequestNr;
    }
}

export abstract class PublisherSubscriptionDataMessage extends PublisherDataMessage {
}

export abstract class PublisherBroadcastDataMessage extends PublisherDataMessage {
    constructor(typeId: DataMessageTypeId, dataItemId: DataItemId) {
        super(typeId, dataItemId, broadcastDataItemRequestNr);
    }
}

// Indicates a data item has received all currently available data.
export class SynchronisedPublisherSubscriptionDataMessage extends PublisherSubscriptionDataMessage {
    static readonly typeId = DataMessageTypeId.Synchronised;

    constructor(dataItemId: DataItemId, dataItemRequestNr: Integer, private _alreadyUnsubscribed: boolean) {
        super(SynchronisedPublisherSubscriptionDataMessage.typeId, dataItemId, dataItemRequestNr);
    }

    get alreadyUnsubscribed() { return this._alreadyUnsubscribed; }
}

export class OnlinedPublisherSubscriptionDataMessage extends PublisherBroadcastDataMessage {
    private static readonly typeId = DataMessageTypeId.PublisherSubscription_Onlined;

    constructor(dataItemId: DataItemId) {
        super(OnlinedPublisherSubscriptionDataMessage.typeId, dataItemId);
    }
}

export class OffliningPublisherSubscriptionDataMessage extends PublisherBroadcastDataMessage {
    private static readonly typeId = DataMessageTypeId.PublisherSubscription_Offlining;

    constructor(dataItemId: DataItemId) {
        super(OffliningPublisherSubscriptionDataMessage.typeId, dataItemId);
    }
}

export class WarningPublisherSubscriptionDataMessage extends PublisherSubscriptionDataMessage {
    private static readonly typeId = DataMessageTypeId.PublisherSubscription_Warning;

    constructor(dataItemId: DataItemId, dataItemRequestNr: Integer, private _warningText: string) {
        super(WarningPublisherSubscriptionDataMessage.typeId, dataItemId, dataItemRequestNr);
    }

    get warningText() { return this._warningText; }
}

export abstract class ErrorPublisherSubscriptionDataMessage extends PublisherDataMessage {
    private static readonly typeId = DataMessageTypeId.PublisherSubscription_Error;

    constructor(dataItemId: DataItemId, dataItemRequestNr: Integer,
        private _errorTypeId: AdiPublisherSubscription.ErrorTypeId, private _errorText: string,
        private _allowedRetryTypeId: AdiPublisherSubscription.AllowedRetryTypeId,
        private _requestSent: boolean,
    ) {
        super(ErrorPublisherSubscriptionDataMessage.typeId, dataItemId, dataItemRequestNr);
    }

    get errorTypeId() { return this._errorTypeId; }
    get errorText() { return this._errorText; }
    get allowedRetryTypeId() { return this._allowedRetryTypeId; }
    get requestSent() { return this._requestSent; }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export class ErrorPublisherSubscriptionDataMessage_Internal extends ErrorPublisherSubscriptionDataMessage {
    constructor(dataItemId: DataItemId, errorText: string) {
        super(dataItemId, broadcastDataItemRequestNr,
            AdiPublisherSubscription.ErrorTypeId.Internal, errorText,
            AdiPublisherSubscription.AllowedRetryTypeId.Never,
            true);
    }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export class ErrorPublisherSubscriptionDataMessage_RequestTimeout extends ErrorPublisherSubscriptionDataMessage {
    constructor(dataItemId: DataItemId, dataItemRequestNr: Integer, errorText: string,
    ) {
        super(dataItemId, dataItemRequestNr,
            AdiPublisherSubscription.ErrorTypeId.RequestTimeout, errorText,
            AdiPublisherSubscription.AllowedRetryTypeId.Delay,
            true);
    }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export class ErrorPublisherSubscriptionDataMessage_Offlined extends ErrorPublisherSubscriptionDataMessage {

    constructor(dataItemId: DataItemId, errorText: string, requestSent: boolean) {
        super(dataItemId, broadcastDataItemRequestNr,
            AdiPublisherSubscription.ErrorTypeId.Offlined, errorText,
            AdiPublisherSubscription.AllowedRetryTypeId.SubscribabilityIncrease,
            requestSent);
    }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export class ErrorPublisherSubscriptionDataMessage_UserNotAuthorised extends ErrorPublisherSubscriptionDataMessage {
    constructor(dataItemId: DataItemId, dataItemRequestNr: Integer, errorText: string) {
        super(dataItemId, dataItemRequestNr,
            AdiPublisherSubscription.ErrorTypeId.UserNotAuthorised, errorText,
            AdiPublisherSubscription.AllowedRetryTypeId.Never,
            true);
    }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export class ErrorPublisherSubscriptionDataMessage_PublishRequestError extends ErrorPublisherSubscriptionDataMessage {
    constructor(dataItemId: DataItemId, dataItemRequestNr: Integer, errorText: string,
        allowedRetryTypeId: AdiPublisherSubscription.AllowedRetryTypeId
    ) {
        super(dataItemId, dataItemRequestNr,
            AdiPublisherSubscription.ErrorTypeId.PublishRequestError, errorText, allowedRetryTypeId,
            true);
    }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export class ErrorPublisherSubscriptionDataMessage_SubRequestError extends ErrorPublisherSubscriptionDataMessage {
    constructor(dataItemId: DataItemId, dataItemRequestNr: Integer, errorText: string,
        allowedRetryTypeId: AdiPublisherSubscription.AllowedRetryTypeId
    ) {
        super(dataItemId, dataItemRequestNr,
            AdiPublisherSubscription.ErrorTypeId.SubRequestError, errorText, allowedRetryTypeId,
            true);
    }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export class ErrorPublisherSubscriptionDataMessage_DataError extends ErrorPublisherSubscriptionDataMessage {
    constructor(dataItemId: DataItemId, dataItemRequestNr: Integer, errorText: string,
        allowedRetryTypeId: AdiPublisherSubscription.AllowedRetryTypeId
    ) {
        super(dataItemId, dataItemRequestNr,
            AdiPublisherSubscription.ErrorTypeId.DataError, errorText, allowedRetryTypeId,
            true);
    }
}

export class ZenithCounterDataMessage extends DataMessage {
    static readonly typeId = DataMessageTypeId.ZenithCounter;

    authExpiryTime: SysTick.Time;
    authFetchSuccessiveFailureCount: Integer;
    socketConnectingSuccessiveErrorCount: Integer;
    zenithTokenFetchSuccessiveFailureCount: Integer;
    zenithTokenRefreshSuccessiveFailureCount: Integer;
    socketClosingSuccessiveErrorCount: Integer;
    socketShortLivedClosedSuccessiveErrorCount: Integer;
    unexpectedSocketCloseCount: Integer;
    timeoutCount: Integer;
    lastTimeoutStateId: ZenithPublisherStateId | undefined;
    receivePacketCount: Integer;
    sendPacketCount: Integer;
    internalSubscriptionErrorCount: Integer;
    requestTimeoutSubscriptionErrorCount: Integer;
    offlinedSubscriptionErrorCount: Integer;
    publishRequestErrorSubscriptionErrorCount: Integer;
    subRequestErrorSubscriptionErrorCount: Integer;
    dataErrorSubscriptionErrorCount: Integer;
    userNotAuthorisedSubscriptionErrorCount: Integer;
    serverWarningSubscriptionErrorCount: Integer;

    constructor() {
        super(ZenithCounterDataMessage.typeId);
    }
}
