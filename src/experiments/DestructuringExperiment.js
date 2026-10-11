import { reactive, ref, toRef, toRefs } from 'vue';
import { reg } from '../composables/useEventLog';
import { N, inc, flip } from './helpers';
export const title = 'Destructuring / toRef / toRefs';
export function build() {
    const user = reg('user', reactive({ name: 'Ali', age: 25 }));
    const { name } = user; // plain copy of a string: reactivity lost
    const nameRef = toRef(user, 'name'); // live link to user.name
    const refs = toRefs(user); // one live ref per property
    return {
        title: 'Destructuring / toRef / toRefs',
        explain: "Destructuring copies the value out of the proxy, so it stays stale and is never re-rendered. toRef and toRefs keep a live link to the property, so their views update.",
        nodes: [N('user.name', 'reactive'), N('user.age', 'reactive'), N('PlainDestructured', 'component'), N('ToRefView', 'component'), N('ToRefsView', 'component')],
        actions: [
            { label: 'Change user.name', run: () => flip('user.name', user, 'name', 'Ali', 'Sara') },
            { label: 'Change user.age', run: () => inc('user.age', user, 'age') }
        ],
        inspect: () => ({ 'user.name': user.name, 'destructured name (stale)': name, 'toRef nameRef.value': nameRef.value, 'toRefs age.value': refs.age.value }),
        probes: [{ name: 'PlainDestructured', get: () => name }, { name: 'ToRefView', get: () => nameRef.value }, { name: 'ToRefsView', get: () => refs.age.value }]
    };
}
