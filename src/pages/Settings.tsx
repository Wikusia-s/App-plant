import React, { useEffect, useState } from 'react';

type ThemeOption = 'light' | 'dark';

function Settings() {
    const [theme, setTheme] = useState<ThemeOption>('light');
    const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);

    useEffect(() => {
        // Load saved settings
        const savedTheme = (localStorage.getItem('app_theme') as ThemeOption) || 'light';
        const savedNotif = localStorage.getItem('app_notifications') === 'true';
        setTheme(savedTheme);
        setNotificationsEnabled(savedNotif);
        applyTheme(savedTheme);
    }, []);

    const applyTheme = (value: ThemeOption) => {
        document.documentElement.setAttribute('data-theme', value === 'dark' ? 'dark' : 'light');
    };

    const handleThemeRadio = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value as ThemeOption;
        setTheme(value);
        localStorage.setItem('app_theme', value);
        applyTheme(value);
    };

    const handleNotificationsRadio = (e: React.ChangeEvent<HTMLInputElement>) => {
        const enabled = e.target.value === 'enabled';
        setNotificationsEnabled(enabled);
        localStorage.setItem('app_notifications', String(enabled));
    };

    return (
        <div className="page">
            <div className="hero" style={{ marginTop: 24 }}>
                <h1>Settings</h1>
                <p className="small">Customize your app preferences.</p>
            </div>

            <div className="container" style={{ maxWidth: 980, margin: '16px auto', padding: '0 16px' }}>
                <div className="panel-grid">
                    <section className="mode-card" style={{ padding: 16, borderRadius: 12 }}>
                        <h3>Appearance</h3>
                        <fieldset className="fieldset">
                            <legend>Theme</legend>
                            <div className="pill-row">
                                <label className="pill pill--option">
                                    <input
                                        type="radio"
                                        name="theme"
                                        value="light"
                                        checked={theme === 'light'}
                                        onChange={handleThemeRadio}
                                    />
                                    <span className="pill-label">Light</span>
                                </label>
                                <label className="pill pill--option">
                                    <input
                                        type="radio"
                                        name="theme"
                                        value="dark"
                                        checked={theme === 'dark'}
                                        onChange={handleThemeRadio}
                                    />
                                    <span className="pill-label">Dark</span>
                                </label>
                            </div>
                        </fieldset>
                    </section>

                    <section className="filter-card" style={{ padding: 16, borderRadius: 12 }}>
                        <h3>Notifications</h3>
                        <fieldset className="fieldset">
                            <legend>Notifications</legend>
                            <div className="pill-row">
                                <label className="pill pill--option">
                                    <input
                                        type="radio"
                                        name="notifications"
                                        value="enabled"
                                        checked={notificationsEnabled === true}
                                        onChange={handleNotificationsRadio}
                                    />
                                    <span className="pill-label">Enable</span>
                                </label>
                                <label className="pill pill--option">
                                    <input
                                        type="radio"
                                        name="notifications"
                                        value="disabled"
                                        checked={notificationsEnabled === false}
                                        onChange={handleNotificationsRadio}
                                    />
                                    <span className="pill-label">Disable</span>
                                </label>
                            </div>
                        </fieldset>
                    </section>

                    <section className="seed-card" style={{ padding: 16, borderRadius: 12 }}>
                        <h3>Language</h3>
                        <p className="small">Coming soon.</p>
                    </section>
                </div>
            </div>
        </div>
    );
}

export default Settings;
