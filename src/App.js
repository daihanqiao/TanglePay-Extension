import React, { useState, useEffect, useRef } from 'react'
import { panelsList } from '@/panels'
import { Base, Trace, I18n, IotaSDK } from '@tangle-pay/common'
import { useChangeNode } from '@tangle-pay/store/common'
import { HashRouter, Route, Redirect } from 'react-router-dom'
import { StoreContext, useStoreReducer } from '@tangle-pay/store'
import { TransitionGroup, CSSTransition } from 'react-transition-group'
import { PasswordDialog } from '@/common'
import { CacheSwitch, CacheRoute } from 'react-router-cache-route'
import { Toast } from '@/common'
import { DappDialog } from '@/common/components/DappDialog'
import './App.less'

const AnimatedSwitch = (props) => {
    const { children } = props
    return (
        <CacheRoute
            render={({ location }) => (
                <TransitionGroup>
                    <CSSTransition key={location.key} classNames='fade' timeout={300}>
                        <CacheSwitch location={location}>{children}</CacheSwitch>
                    </CSSTransition>
                </TransitionGroup>
            )}
        />
    )
}

const App = () => {
    const [store, dispatch] = useStoreReducer()
    const changeNode = useChangeNode(dispatch)
    const [sceneList, setSceneList] = useState([])
    const passwordDialog = useRef()
    const getLocalInfo = async () => {
        const list = [
            'common.curNodeId',
            'common.showAssets',
            'common.price',
            'common.activityData',
            'common.walletsList'
        ]
        const res = await Promise.all(list.map((e) => Base.getLocalData(e)))
        list.forEach((e, i) => {
            switch (e) {
                case 'common.curNodeId':
                    changeNode(res[i] || 1)
                    break
                case 'common.walletsList':
                    // in the case of extension, respect background data first
                    const bg = window.chrome?.extension?.getBackgroundPage()
                    let list = res[i]
                    if (bg) {
                        list = bg.getBackgroundData(e) || res[i]
                    }
                    dispatch({ type: e, data: list })
                    break
                default:
                    dispatch({ type: e, data: res[i] })
                    break
            }
        })
        // i18n init
        const lang = I18n.language || 'en'
        dispatch({ type: 'common.lang', data: lang })
    }
    const init = async () => {
        Trace.login()
        await getLocalInfo()
        setSceneList(panelsList)
    }
    useEffect(() => {
        Base.globalInit({
            store,
            dispatch,
            Toast
        })
        IotaSDK.passwordDialog = passwordDialog
        init()
    }, [])
    if (sceneList.length === 0) {
        return null
    }
    return (
        <div id='app' className='App'>
            <StoreContext.Provider
                value={{
                    store,
                    dispatch
                }}>
                <HashRouter ref={(router) => (Base.navigator = router)}>
                    <AnimatedSwitch>
                        {panelsList.map((item) => {
                            const key = `/${item.path}`
                            const RouteCom = item.path === 'main' ? CacheRoute : Route
                            return <RouteCom path={key} exact key={key} render={() => <item.component key={key} />} />
                        })}
                        <CacheRoute exact path='/'>
                            <Redirect to={store.common.walletsList.length > 0 ? '/main' : '/account/login'} />
                        </CacheRoute>
                    </AnimatedSwitch>
                </HashRouter>
                <PasswordDialog dialogRef={passwordDialog} />
                <DappDialog />
            </StoreContext.Provider>
        </div>
    )
}

export default App