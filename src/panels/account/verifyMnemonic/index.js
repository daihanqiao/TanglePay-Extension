import React, { useState, useRef, useEffect } from 'react'
import { Base, I18n } from '@tangle-pay/common'
import { Button, Swiper } from 'antd-mobile'
import { useLocation } from 'react-router-dom'
import { Nav } from '@/common'
import './index.less'

const VerifyItem = ({ setNext, index, word, err, isTop, isLast }) => {
    const [error, setError] = useState(false)
    const handleVerify = (curWord) => {
        console.log(curWord, index, '===============================')
        if (word === curWord) {
            isLast ? Base.push('/account/verifySucc') : setNext()
        }
        setError(word !== curWord)
    }
    const topStr = isTop ? word : err
    const bottomStr = isTop ? err : word
    return (
        <div className='ph50 bgW'>
            <div style={{ marginTop: 120, marginBottom: 120 }}>
                <div className={`fz16 tc ${error && 'cR'}`}>Word # {index + 1}</div>
            </div>
            <div>
                <Button
                    type='submit'
                    size='large'
                    color='default'
                    className='mb20'
                    onClick={() => handleVerify(topStr)}
                    block>
                    {topStr}
                </Button>
                <Button type='submit' size='large' color='default' onClick={() => handleVerify(bottomStr)} block>
                    {bottomStr}
                </Button>
            </div>
        </div>
    )
}

export const AccountVerifyMnemonic = () => {
    let params = useLocation()
    params = Base.handlerParams(params.search)
    let { list = '', errList = '' } = params
    list = (list || '').split(',')
    errList = (errList || '').split(',')
    const carousel = useRef()
    const setNext = () => {
        carousel.current.swipeNext()
    }
    useEffect(() => {
        document.onkeydown = (e) => {
            if (e.code == 'Space') {
                e.stopPropagation()
                e.preventDefault()
            }
        }
        return () => {
            document.onkeydown = null
        }
    }, [])
    return (
        <div className='page verify-mnemonic-page'>
            <Nav title={I18n.t('account.testBackup')} />
            <Swiper ref={carousel} allowTouchMove={false} autoplay={false} loop={false}>
                {list.map((item, index) => {
                    return (
                        <Swiper.Item key={`${item.word}_${index}`}>
                            <VerifyItem
                                setNext={setNext}
                                key={`${item.word}_${index}`}
                                word={item}
                                err={errList[index]}
                                index={index}
                                isTop={Math.random() >= 0.5}
                                isLast={index === list.length - 1}
                            />
                        </Swiper.Item>
                    )
                })}
            </Swiper>
        </div>
    )
}