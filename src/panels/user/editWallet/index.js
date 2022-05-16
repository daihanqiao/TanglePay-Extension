import React, { useEffect, useRef, useState } from 'react'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { Base, I18n } from '@tangle-pay/common'
import { useLocation } from 'react-router-dom'
import { NameDialog } from './nameDialog'
import { useGetNodeWallet } from '@tangle-pay/store/common'
import { Nav, SvgIcon, Toast } from '@/common'

export const UserEditWallet = () => {
    let params = useLocation()
    const [contentW, setContentW] = useState(375)
    params = Base.handlerParams(params.search)
    const id = params.id
    const [, walletsList] = useGetNodeWallet()
    const curEdit = walletsList.find((e) => e.id === id) || {}
    const name = curEdit.name || ''
    const dialogRef = useRef()
    useEffect(() => {
        setContentW(document.getElementById('app').offsetWidth)
    }, [])
    return (
        <div>
            <Nav title={I18n.t('user.manage')} />
            <div>
                <div className='flex row ac p20 border-b border-box'>
                    <div className='flex c mr15 bgP' style={{ width: 40, height: 40, borderRadius: 40 }}>
                        <div className='cW fz15'>{name[0] || ''}</div>
                    </div>
                    <div className='flex1'>
                        <div className='flex ac row mb10'>
                            <div className='fz15 mr10'>{name}</div>
                            <SvgIcon
                                className='cB press'
                                onClick={() => {
                                    dialogRef.current.show()
                                }}
                                size={16}
                                name='edit'
                            />
                        </div>
                        <div className='flex ac row'>
                            <div style={{ width: contentW - 100 }}>
                                <div className='fz15 cS' style={{ wordWrap: 'break-word', lineHeight: '20px' }}>
                                    {curEdit.address}
                                    <CopyToClipboard
                                        text={curEdit.address}
                                        onCopy={() => Toast.success(I18n.t('assets.copied'))}>
                                        <SvgIcon
                                            style={{ display: 'inline-block', verticalAlign: 'middle' }}
                                            wrapper='span'
                                            name='copy'
                                            size={16}
                                            className='cB press ml10'
                                        />
                                    </CopyToClipboard>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    onClick={() => {
                        Base.push('/user/walletPassword', {
                            ...curEdit
                        })
                    }}
                    className='press p20 flex row jsb ac border-b'>
                    <div className='fz15'>{I18n.t('user.resetPassword')}</div>
                    <SvgIcon name='right' size={15} className='cB' />
                </div>
            </div>
            <NameDialog dialogRef={dialogRef} data={{ ...curEdit }} />
        </div>
    )
}