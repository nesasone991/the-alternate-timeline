import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppRoutes } from '../../src/app/App';
import { SETTINGS_STORAGE_KEY } from '../../src/features/settings/settings';
import { __resetSettingsStoreForTests } from '../../src/features/settings/settingsStore';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  __resetSettingsStoreForTests();
});

afterEach(() => {
  cleanup();
});

describe('home page', () => {
  it('shows the product name and the two hero actions', () => {
    renderAt('/');
    expect(screen.getByRole('heading', { level: 1, name: 'The Alternate Timeline' })).toBeTruthy();
    const main = within(screen.getByRole('main'));
    expect(main.getByRole('link', { name: 'Explore History' }).getAttribute('href')).toBe('/explore');
    expect(main.getByRole('link', { name: 'How It Works' }).getAttribute('href')).toBe('/how-it-works');
    expect(main.getByRole('link', { name: 'Explore Campaign' }).getAttribute('href')).toBe('/campaigns/fall-of-rome');
  });

  it('navigates to the explorer', () => {
    renderAt('/');
    fireEvent.click(within(screen.getByRole('main')).getByRole('link', { name: 'Explore History' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Explore History' })).toBeTruthy();
  });
});

describe('campaign explorer', () => {
  it('gives coming-soon campaigns no link or button', () => {
    renderAt('/explore');
    for (const title of ['Napoleon', 'The Viking Age']) {
      const card = screen.getByRole('article', { name: title });
      expect(within(card).queryAllByRole('link')).toHaveLength(0);
      expect(within(card).queryAllByRole('button')).toHaveLength(0);
      expect(within(card).getByText('Not yet available')).toBeTruthy();
    }
    const rome = screen.getByRole('article', { name: 'The Fall of Rome' });
    expect(within(rome).getByRole('link', { name: 'Explore campaign' }).getAttribute('href')).toBe('/campaigns/fall-of-rome');
  });
});

describe('campaign overview', () => {
  it('lists sourced events and enters the workspace', async () => {
    renderAt('/campaigns/fall-of-rome');
    expect(screen.getByRole('heading', { level: 3, name: 'Odoacer deposes Romulus Augustulus' })).toBeTruthy();
    fireEvent.click(screen.getByRole('link', { name: 'Open the workspace' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'The Fall of Rome' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /Real History/ }).getAttribute('aria-selected')).toBe('true');
  });

  it('shows not-found for unknown campaigns', () => {
    renderAt('/campaigns/atlantis');
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeTruthy();
  });
});

describe('workspace', () => {
  it('steps through real events and explains the unbuilt comparison mode', async () => {
    renderAt('/campaigns/fall-of-rome/workspace');
    await screen.findByRole('heading', { level: 1, name: 'The Fall of Rome' });
    const slider = screen.getByRole('slider', { name: 'Year' }) as HTMLInputElement;
    expect(slider.value).toBe('455');
    fireEvent.click(screen.getByRole('button', { name: 'Next event' }));
    expect(screen.getByRole('heading', { level: 4, name: 'Vandals sack Rome' })).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: /Comparison/ }));
    expect(screen.getByText('Comparison is not available yet.')).toBeTruthy();
    expect((screen.getByRole('slider', { name: 'Year' }) as HTMLInputElement).disabled).toBe(true);
  });

  it('plays decision 1: confirming a choice changes the resources deterministically', async () => {
    renderAt('/campaigns/fall-of-rome/workspace?mode=alternate');
    await screen.findByRole('heading', { name: 'Fiscal survival' });
    expect(screen.getByTestId('resource-economy').textContent).toContain('40');

    const confirm = screen.getByRole('button', { name: 'Confirm decision' }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    fireEvent.click(screen.getByRole('radio', { name: /Pay the armies first/ }));
    expect(confirm.disabled).toBe(false);
    fireEvent.click(confirm);

    expect(screen.getByRole('heading', { name: 'You chose: Pay the armies first' })).toBeTruthy();
    expect(screen.getByTestId('resource-military').textContent).toContain('59');
    expect(screen.getByTestId('resource-economy').textContent).toContain('28');
    expect(screen.getByTestId('resource-legitimacy').textContent).toContain('34');

    fireEvent.click(screen.getByRole('button', { name: 'Start over' }));
    expect(screen.getByRole('heading', { name: 'Fiscal survival' })).toBeTruthy();
    expect(screen.getByTestId('resource-economy').textContent).toContain('40');
  });
});

describe('settings', () => {
  it('saves a changed preference to local storage', () => {
    renderAt('/');
    fireEvent.click(screen.getAllByRole('button', { name: 'Settings' })[0]!);
    fireEvent.click(screen.getByLabelText('476 CE'));
    const stored = JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}') as { eraNotation?: string };
    expect(stored.eraNotation).toBe('CE');
    expect(screen.getByText('476 CE', { selector: 'p' })).toBeTruthy();
  });
});
