import SvelteGenericCrudService from './SvelteGenericCrudTable.svelte'
import { render, fireEvent } from '@testing-library/svelte'

it('it works', async () => {
    const { svelteGenericCrudService } = render(SvelteGenericCrudService)

    const table = svelteGenericCrudService

    expect(table).toBe(undefined)
})
