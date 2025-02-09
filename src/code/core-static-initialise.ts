/**
 * %license Motif
 * (c) 2021 Paritech Wealth Technology
 * License: motionite.trade/license/motif
 */

import { AdiStaticInitialise } from './adi/adi-internal-api';
import { CommandStaticInitialise } from './command/command-internal-api';
import { GridStaticInitialise } from './grid/internal-api';
import { PublisherStaticInitialise } from './publisher/publisher-internal-api';
import { RankedLitIvemIdListStaticInitialise } from './ranked-lit-ivem-id-list/ranked-lit-ivem-id-list-internal-api';
import { ResStaticInitialise } from './res/res-internal-api';
import { ScanStaticInitialise } from './scan/internal-api';
import { SequenceHistoryStaticInitialise } from './sequence-history/sequence-history-internal-api';
import { ServicesStaticInitialise, SettingsStaticInitialise } from './services/services-internal-api';
import { SysStaticInitialise } from './sys/sys-internal-api';

export namespace CoreStaticInitialise {
    export function initialise() {
        ResStaticInitialise.initialise();
        SysStaticInitialise.initialise();
        PublisherStaticInitialise.initialise();
        AdiStaticInitialise.initialise();
        SettingsStaticInitialise.initialise();
        CommandStaticInitialise.initialise();
        ServicesStaticInitialise.initialise();
        SequenceHistoryStaticInitialise.initialise();
        ScanStaticInitialise.initialise();
        RankedLitIvemIdListStaticInitialise.initialise();
        GridStaticInitialise.initialise();
    }
}

CoreStaticInitialise.initialise();
