import React, { useState, useEffect } from 'react'
import { Button, Input } from 'antd-mobile'
import { Base, I18n, IotaSDK } from '@tangle-pay/common'
import { Toast } from '@/common'
import { useGetNodeWallet } from '@tangle-pay/store/common'
import BigNumber from 'bignumber.js'
import abi from './testUSDT'
const XLSX = window.XLSX

export const TestSendEVM = () => {
    const [mnemonicList, setMnemonicList] = useState([])
    const [addressInfoList, setAddressInfoList] = useState([])
    const [importList, setImportList] = useState([])
    const [curWallet] = useGetNodeWallet()
    const [password, setPassword] = useState('')
    const [amount, setAmount] = useState('')
    const [gasPrice, setGasPrice] = useState('')
    const [gasLimit, setGasLimit] = useState('')
    const [contract, setContract] = useState('')
    useEffect(() => {
        if (IotaSDK.checkWeb3Node(curWallet.nodeId)) {
            const eth = IotaSDK.client.eth
            Promise.all([eth.getGasPrice(), IotaSDK.getDefaultGasLimit(curWallet.address, contract)]).then(
                ([gasPrice, gas]) => {
                    setGasLimit(gas)
                    setGasPrice(gasPrice)
                }
            )
        }
    }, [curWallet.nodeId, contract])
    return (
        <div>
            <Button
                onClick={() => {
                    const list = []
                    for (let i = 0; i < 100; i++) {
                        const code = IotaSDK.getMnemonic()
                        list.push(code)
                    }
                    console.log('助记词生成完成')
                    setMnemonicList(list)
                }}>
                生成100个助记词
            </Button>
            <Button
                onClick={async () => {
                    if (mnemonicList.length <= 0) {
                        return
                    }
                    console.log('开始生成完成')
                    Toast.showLoading()
                    const list = []
                    for (const item of mnemonicList) {
                        const res = await IotaSDK.importMnemonic({
                            mnemonic: item,
                            name: Math.random(),
                            password: 'a12345678'
                        })
                        list.push(res)
                    }
                    console.log('生成完成')
                    Toast.hideLoading()
                    setAddressInfoList(list)
                }}>
                将助记词生成地址
            </Button>
            <Button
                onClick={() => {
                    const sheet = []
                    addressInfoList.forEach((e, i) => {
                        sheet.push({
                            助记词: mnemonicList[i],
                            地址: e.address,
                            节点id: IotaSDK.curNode?.id,
                            bech32HRP: IotaSDK.info?.bech32HRP,
                            本地密钥: e.seed
                        })
                    })
                    const workBook = {
                        SheetNames: ['Sheet1'],
                        Sheets: {
                            Sheet1: XLSX.utils.json_to_sheet(sheet)
                        },
                        Props: {}
                    }
                    XLSX.writeFile(workBook, `address.xlsx`, {
                        type: 'file',
                        bookType: 'xlsx'
                    })
                }}>
                将助记词+地址导出
            </Button>
            <input
                className='mt24'
                placeholder='导入地址exl'
                type='file'
                onInput={(e) => {
                    const file = e.target.files[0]
                    const reader = new FileReader()
                    reader.readAsBinaryString(file)
                    reader.onload = function (e) {
                        const data = e.target.result
                        const excelData = window.XLSX.read(data, {
                            type: 'binary'
                        })
                        console.log(excelData)
                        const xlsxData = {}
                        excelData.SheetNames.map((e) => {
                            xlsxData[e] = window.XLSX.utils.sheet_to_json(excelData.Sheets[e], {
                                raw: false,
                                defval: null,
                                dateNF: 'MM-DD-YYYY'
                            })
                        })
                        setImportList(xlsxData.Sheet1)
                    }
                }}
            />
            <div className='border'>
                <Input
                    placeholder='请输入当前钱包密码'
                    onChange={(e) => {
                        setPassword(e)
                    }}
                />
            </div>
            <div className='border'>
                <Input
                    placeholder='请输入每个地址划转金额'
                    onChange={(e) => {
                        setAmount(e)
                    }}
                />
            </div>
            <div className='border'>
                <Input
                    value={gasPrice}
                    placeholder='请输入gasPrice'
                    onChange={(e) => {
                        setGasPrice(e)
                    }}
                />
            </div>
            <div className='border'>
                <Input
                    value={gasLimit}
                    placeholder='请输入gasLimit'
                    onChange={(e) => {
                        setGasLimit(e)
                    }}
                />
            </div>
            <div className='border'>
                <Input
                    placeholder='请输入合约地址'
                    onChange={(e) => {
                        setContract(e)
                    }}
                />
            </div>
            <Button
                onClick={async () => {
                    const web3Contract = IotaSDK.getContract(contract)
                    let decimal = await web3Contract.methods.decimals().call()
                    let symbol = await web3Contract.methods.symbol().call()
                    decimal = parseInt(decimal)
                    decimal = Math.pow(10, decimal)
                    let i = 1
                    for (const item of importList) {
                        const receiver = item['地址']
                        let sendAmount = Number(BigNumber(amount).times(decimal))
                        await IotaSDK.send({ ...curWallet, password }, receiver, sendAmount, {
                            contract,
                            token: symbol,
                            decimal,
                            gas: gasLimit,
                            gasPrice: gasPrice
                        })
                        const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
                        console.log(`完成第${i}个`)
                        i++
                        await sleep(5000)
                    }
                    console.log('全部完成')
                }}>
                往导入地址中转入合约TOKEN
            </Button>
        </div>
    )
}
