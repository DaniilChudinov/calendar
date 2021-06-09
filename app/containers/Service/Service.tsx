import { getFeastInfo } from 'domain/getDayInfo';

import React, { Suspense, useState, useEffect, useContext } from 'react';
import { useParams, useHistory, Redirect } from 'react-router-dom';
import ScrollRestoration from 'react-scroll-restoration';
import { css } from 'emotion';
import useDay from 'hooks/useDay';
import Zoom from 'components/Zoom/Zoom';
import Loader from 'components/Loader/Loader';
import { useTheme } from 'emotion-theming';
import LayoutInner from 'components/LayoutInner/LayoutInner';
import CalendarToggle from 'components/CalendarToggle/CalendarToggle';
import { useSubscriptionService } from 'stateMachines/subscription';

import LanguageSwitcher from './LanguageSwitcher';
import TOCSwitcher from './TOCSwitcher';
import makeServices from './Texts/Texts';
import MDXProvider from './MDXProvider';
import ParallelLanguageBar from './ParallelLanguageBar';
import { LangContext } from './LangContext';
const reloadOnFailedImport = (e) => {
    console.warn('Imported asset not available, probably time to re-deploy', e);
    Sentry.captureException?.(e);
    location.reload();
};

const toUpperCase = (name) => name.charAt(0).toUpperCase() + name.slice(1);

const Service = () => {
    const { serviceId: originalServiceId, date } = useParams();
    const { data: day } = useDay(date);
    const [state, send] = useSubscriptionService();

    const machineLoaded = state.matches('loaded');

    useEffect(() => {
        if (machineLoaded) {
            send({
                type: 'CHOOSE_BOOK',
                serviceId: originalServiceId,
            });
        }
    }, [machineLoaded]);

    if (!originalServiceId) {
        return <div>No service id</div>;
    }
    const theme = useTheme();

    const history = useHistory();

    const langState = useContext(LangContext);

    const { vasiliy, lpod } = getFeastInfo(new Date(date));

    // Expand serviceId
    let serviceId;

    if (day?.readings?.[originalServiceId]) {
        if (originalServiceId === 'Литургия') {
            serviceId = vasiliy ? 'vasiliy' : 'zlatoust';
        } else if (originalServiceId === 'Вечерня' && lpod) {
            serviceId = 'lpod';
        }
    }

    const services = makeServices(date, day?.readings);
    const service = services.find((service) => service.id === (serviceId || originalServiceId));

    if (service?.skipRedirect) {
        serviceId = originalServiceId;
    }

    const [TextComponent, setTextComponent] = useState();
    useEffect(() => {
        if (serviceId) {
            const serviceIdUpper = toUpperCase(serviceId);
            const Component = React.lazy(async () =>
                import(`./Texts/${serviceIdUpper}/index.dyn.tsx`).catch(reloadOnFailedImport)
            );
            setTextComponent(Component);
        }
    }, [serviceId]);

    if (!day) {
        return <Loader />;
    }
    console.log(serviceId, 'aasd');
    // If service not found, redirect
    if (!serviceId) {
        if (day?.readings) {
            if (day?.readings?.['Литургия']) {
                return <Redirect to={{ pathname: `/date/${date}/service/Литургия`, state: history.location.state }} />;
            }
            if (day?.readings?.['Вечерня'] && lpod) {
                return <Redirect to={{ pathname: `/date/${date}/service/Вечерня`, state: history.location.state }} />;
            }
            return <Redirect to={`/date/${date}`} />;
        }
    }

    const setNewDate = (dateString) => {
        history.push({
            pathname: `/date/${dateString}/service/${originalServiceId}`,
            state: { backLink: history.location.state?.backLink },
        });
    };

    const left = (
        <>
            <CalendarToggle
                date={date}
                setNewDate={setNewDate}
                className={css`
                    margin-right: 8px;
                `}
            />
            {service?.lang && <LanguageSwitcher />}
            <TOCSwitcher service={service} lang={langState.lang} />
        </>
    );

    // If service has no lang support, force it to 'ru'
    const effectiveLangState = service?.lang ? langState : { ...langState, lang: 'ru' };

    return (
        <LangContext.Provider value={effectiveLangState}>
            <LayoutInner left={left} paddedContent={false}>
                <ParallelLanguageBar />
                <Zoom>
                    <>
                        <div
                            className={css`
                                margin-left: 12px;
                                margin-right: 12px;
                                margin-bottom: 24px;
                            `}
                        >
                            <div
                                className={css`
                                    position: relative;
                                    background: ${theme.colours.bgGray};
                                    margin: 0 -12px 24px -12px;
                                    padding: 12px 12px 12px 12px;
                                    font-size: 13px;
                                    color: ${theme.colours.darkGray};
                                `}
                            >
                                Изменяемые части богослужения составлены нашим роботом-уставщиком. Он иногда ошибается.
                                За наиболее точной информацией обращайтесь к{' '}
                                <a
                                    className={css`
                                        text-decoration: underline;
                                    `}
                                    href={`http://www.patriarchia.ru/bu/${date}`}
                                    target="_blank"
                                >
                                    богослужебным указаниям.
                                </a>{' '}
                                Если вы обнаружили ошибку, пожалуйста,{' '}
                                <a
                                    className={css`
                                        text-decoration: underline;
                                    `}
                                    href="mailto:pb@psmb.ru"
                                    target="_blank"
                                >
                                    напишите нам
                                </a>
                            </div>

                            <MDXProvider>
                                <Suspense fallback={<Loader />}>
                                    <ScrollRestoration />
                                    {TextComponent && <TextComponent date={date} lang={langState.lang} />}
                                </Suspense>
                            </MDXProvider>
                        </div>
                    </>
                </Zoom>
            </LayoutInner>
        </LangContext.Provider>
    );
};
export default Service;
