import { reactive } from 'vue';
import { iComputed, iWatch, reg } from '../composables/useEventLog';
import { N, inc, flip } from './helpers';
export const title = 'reactive()';
export function build() {
    const user = reg('user', reactive({ name: 'Ali', age: 25, address: reg('user.address', reactive({ city: 'Lahore' })) }));
    const nameLabel = iComputed('nameLabel', () => user.name.toUpperCase());
    const cityLabel = iComputed('cityLabel', () => user.address.city + ' (city)');
    iWatch('ageWatcher', () => user.age);
    return {
        title: 'reactive()',
        explain: "user is a reactive object, and tracking is per property, also through nested objects. name only reaches nameLabel, city only cityLabel, age only ageWatcher. Changing age shows that unrelated dependents do not run.",
        nodes: [N('user.name', 'reactive'), N('user.age', 'reactive'), N('user.address.city', 'reactive'),
            N('nameLabel', 'computed'), N('cityLabel', 'computed'), N('ageWatcher', 'watcher'), N('Profile', 'component')],
        actions: [
            { label: 'Change name', run: () => flip('user.name', user, 'name', 'Ali', 'Sara') },
            { label: 'Change age', hint: 'unrelated', run: () => inc('user.age', user, 'age') },
            { label: 'Change nested city', run: () => flip('user.address.city', user.address, 'city', 'Lahore', 'Karachi') }
        ],
        inspect: () => ({ 'user.name': user.name, 'user.age': user.age, 'user.address.city': user.address.city, nameLabel: nameLabel.value, cityLabel: cityLabel.value }),
        probes: [{ name: 'Profile', get: () => `${nameLabel.value} / ${cityLabel.value}` }]
    };
}
