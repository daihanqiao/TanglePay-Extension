import React, { useState, useEffect } from 'react'
import { PullToRefresh, Loading } from 'antd-mobile'
import { Base, I18n } from '@tangle-pay/common'
import { AssetsNav, SvgIcon } from '@/common'
import { useStore } from '@tangle-pay/store'
import { CoinList, ActivityList, RewardsList, CollectiblesList } from './list'
import { useGetNodeWallet, useGetAssetsList, useGetLegal } from '@tangle-pay/store/common'
import { useGetEventsConfig } from '@tangle-pay/store/staking'

export const Assets = () => {
    useGetEventsConfig()
    const [height, setHeight] = useState(0)
    const [isRequestAssets] = useStore('common.isRequestAssets')
    const [isRequestHis] = useStore('common.isRequestHis')
    const [isShowAssets, setShowAssets] = useStore('common.showAssets')
    const [, refreshAssets] = useStore('common.forceRequest')
    const [curWallet] = useGetNodeWallet()
    // const [search, setSearch] = useState('')
    const [curTab, setTab] = useState(0)
    useGetAssetsList(curWallet)
    const [totalAssets] = useStore('common.totalAssets')
    const curLegal = useGetLegal()
    const checkPush = (path) => {
        if (!curWallet.address) {
            Base.push('/account/register')
            return
        }
        Base.push(path)
    }
    useEffect(() => {
        const dom = document.getElementById('content-id')
        const height = document.body.offsetHeight - dom.offsetTop - 51
        setHeight(height)
    }, [])
    return (
        <div className='h100'>
            <AssetsNav />
            <PullToRefresh
                renderText={() => <Loading />}
                onRefresh={() => {
                    if (isRequestAssets && isRequestHis) {
                        refreshAssets(Math.random())
                    }
                }}>
                <div>
                    <div className='ph15'>
                        <div className='mt5' style={{ background: '#1D70F7', borderRadius: 10, overflow: 'hidden' }}>
                            <div className='flex ph15 row ac'>
                                <div className='fz16 cW'>
                                    {I18n.t('assets.myAssets')}({curLegal.unit || ''})
                                </div>
                                <SvgIcon
                                    name={isShowAssets ? 'eye_1' : 'eye_0'}
                                    size={24}
                                    className='m15 press cW'
                                    onClick={() => setShowAssets(!isShowAssets)}
                                />
                            </div>
                            <div className='ph15 mb15'>
                                <div className='cW fz20'>{isShowAssets ? totalAssets.assets || '0.00' : '****'}</div>
                            </div>
                            <div className='flex row pv10' style={{ background: '#1F7EFC' }}>
                                <div
                                    onClick={() => {
                                        checkPush('assets/send')
                                    }}
                                    className='flex1 flex c pv5 press'
                                    style={{ borderRight: '1px solid #fff' }}>
                                    <div className='cW fz17'>{I18n.t('assets.send')}</div>
                                </div>
                                <div
                                    onClick={() => {
                                        checkPush('assets/receive')
                                    }}
                                    className='flex1 flex c pv5 press'>
                                    <div className='cW fz17'>{I18n.t('assets.receive')}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='ph15 flex row jsb ac mt10 border-b'>
                        <div className='w100 flex row ac jsb'>
                            <div className='flex row ac'>
                                <div onClick={() => setTab(0)} className='flex c pv15 mr30 press'>
                                    <div className={`${curTab === 0 ? 'cP' : 'cB'} fz15`}>
                                        {I18n.t('assets.assets')}
                                    </div>
                                </div>
                                <div onClick={() => setTab(1)} className='press flex c pv15'>
                                    <div className={`${curTab === 1 ? 'cP' : 'cB'} fz15`}>
                                        {I18n.t('nft.collectibles')}
                                    </div>
                                </div>
                            </div>
                            <div onClick={() => setTab(2)} className='press flex c pv15'>
                                <div className={`${curTab === 2 ? 'cP' : 'cB'} fz15`}>{I18n.t('assets.activity')}</div>
                            </div>
                        </div>
                    </div>
                    <div className='ph15' id='content-id' style={{ height, overflowY: 'scroll' }}>
                        {curTab === 0 ? (
                            <div>
                                <CoinList />
                                <RewardsList />
                            </div>
                        ) : curTab == 1 ? (
                            <CollectiblesList />
                        ) : (
                            <ActivityList />
                        )}
                    </div>
                </div>
            </PullToRefresh>
        </div>
    )
}