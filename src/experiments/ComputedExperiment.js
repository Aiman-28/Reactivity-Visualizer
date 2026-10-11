import { reactive } from 'vue';
import { iComputed, reg, log, execCount } from '../composables/useEventLog';
import { N, inc, flip } from './helpers';
export const title = 'computed() + caching';
export function build() {
    const state = reg('state', reactive({ count: 1, firstName: 'Ali', lastName: 'Khan', a: 2, b: 3 }));
    const double = iComputed('doubleCount', () => state.count * 2);
    const full = iComputed('fullName', () => `${state.firstName} ${state.lastName}`);
    const total = iComputed('total', () => state.a + state.b);
    const read = () => {
        for (let i = 1; i <= 3; i++) {
            const before = execCount('doubleCount');
            void double.value;
            log('COMPUTED', 'doubleCount', execCount('doubleCount') === before
                ? `read #${i}: served from cache, getter NOT executed` : `read #${i}: getter executed (value was dirty)`);
        }
    };
    return {
        title: 'computed() + caching',
        explain: "Computeds are lazy and cached. After a change, only the first read executes the getter; further reads are served from cache. fullName joins firstName and lastName, so changing either recalculates only fullName; doubleCount and total never run, because tracking is per property.",
        nodes: [N('state.count', 'reactive'), N('state.firstName', 'reactive'), N('state.lastName', 'reactive'), N('state.a', 'reactive'), N('state.b', 'reactive'),
            N('doubleCount', 'computed'), N('fullName', 'computed'), N('total', 'computed')],
        actions: [
            { label: 'Read doubleCount ×3', hint: 'proves caching', run: read },
            { label: 'count++', run: () => inc('state.count', state, 'count') },
            { label: 'Change first name', hint: 'unrelated', run: () => flip('state.firstName', state, 'firstName', 'Ali', 'Sara') },
            { label: 'Change last name', run: () => flip('state.lastName', state, 'lastName', 'Khan', 'Ahmed') },
            { label: 'a++', hint: 'updates total', run: () => inc('state.a', state, 'a') },
            { label: 'b++', hint: 'updates total', run: () => inc('state.b', state, 'b') }
        ],
        inspect: () => ({ 'state.count': state.count, 'state.firstName': state.firstName, 'state.lastName': state.lastName, doubleCount: double.value, fullName: full.value, total: total.value,
            'getter executions (doubleCount)': execCount('doubleCount') }),
        probes: []
    };
}
