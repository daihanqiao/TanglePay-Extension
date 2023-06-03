import React, { useState, useEffect } from 'react'
import { Button, Input } from 'antd-mobile'
import { Base, I18n, IotaSDK } from '@tangle-pay/common'
import { Toast } from '@/common'
import { useGetNodeWallet } from '@tangle-pay/store/common'
import BigNumber from 'bignumber.js'
import { useStore } from '@tangle-pay/store'
const XLSX = window.XLSX

export const TestSendSMR = () => {
    const [mnemonicList, setMnemonicList] = useState([])
    const [addressInfoList, setAddressInfoList] = useState([])
    const [importList, setImportList] = useState([])
    const [curWallet] = useGetNodeWallet()
    const [password, setPassword] = useState('')
    const [amount, setAmount] = useState('')
    const [gasPrice, setGasPrice] = useState('')
    const [gasLimit, setGasLimit] = useState('')
    const [contract, setContract] = useState('')
    const [tokenId, setTokenId] = useState('')
    useEffect(() => {
        if (IotaSDK.checkWeb3Node(curWallet.nodeId)) {
            const eth = IotaSDK.client.eth
            Promise.all([eth.getGasPrice(), IotaSDK.getDefaultGasLimit(curWallet.address, contract)]).then(([gasPrice, gas]) => {
                setGasLimit(gas)
                setGasPrice(gasPrice)
            })
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
                    placeholder='需要转账的tokenId，不填则转平台币'
                    onChange={(e) => {
                        setTokenId(e)
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
            {/* <div className='border'>
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
            </div> */}
            <Button
                onClick={async () => {
                    // SOON
                    const tokenId = '0x0884298fe9b82504d26ddb873dbd234a344c120da3a4317d8063dbcf96d356aa9d0100000000'
                    if (tokenId) {
                        const { seed, address } = curWallet
                        const baseSeed = IotaSDK.getSeed(seed, password)
                        const balanceRes = await IotaSDK.IotaObj.addressBalance(IotaSDK.client, address)
                        const balance = BigNumber(Number(balanceRes.available))
                        let decimal = Math.pow(10, 6) //SOON精度
                        let sendAmount = Number(BigNumber(amount).times(decimal))
                        const addressList = importList.map((e) => e['地址'])
                        console.log(addressList)
                        let sendSMRAmount = new BigNumber(0)
                        let totalSendTokenAmount = new BigNumber(0)
                        let outputList = addressList.map((e) => {
                            const output = {
                                address: `0x${IotaSDK.bech32ToHex(e)}`,
                                addressType: 0, // ED25519_ADDRESS_TYPE
                                amount: '',
                                type: 3, // BASIC_OUTPUT_TYPE
                                nativeTokens: [
                                    {
                                        id: tokenId,
                                        amount: `0x${BigNumber(sendAmount).toString(16)}`
                                    }
                                ],
                                unlockConditions: [
                                    {
                                        type: 0, // ADDRESS_UNLOCK_CONDITION_TYPE
                                        address: IotaSDK.IotaObj.Bech32Helper.addressFromBech32(e, IotaSDK.info.protocol.bech32Hrp)
                                    }
                                ]
                            }
                            totalSendTokenAmount = totalSendTokenAmount.plus(sendAmount)
                            const deposit = IotaSDK.IotaObj.TransactionHelper.getStorageDeposit(output, IotaSDK.info.protocol.rentStructure)
                            output.amount = deposit.toString()
                            sendSMRAmount = sendSMRAmount.plus(deposit.toString())
                            return output
                        })
                        console.log(totalSendTokenAmount.valueOf())
                        console.log(outputList)

                        const path = IotaSDK.IotaObj.generateBip44Address({
                            accountIndex: 0,
                            addressIndex: 0,
                            isInternal: false
                        })
                        const addressSeed = baseSeed.generateSeedFromPath(new IotaSDK.IotaObj.Bip32Path(path))
                        const addressKeyPair = addressSeed.keyPair()
                        const response = await IotaSDK.IndexerPluginClient.outputs({ addressBech32: address })
                        const localOutputDatas = await Promise.all(response.items.map((outputId) => IotaSDK.client.output(outputId)))

                        let inputsAndSignatureKeyPairs = []
                        for (const output of localOutputDatas) {
                            if (!output.metadata.isSpent) {
                                if (output.output.nativeTokens?.length > 0) {
                                    const curTotal = new BigNumber(output.output.nativeTokens[0].amount)
                                    outputList.push({
                                        address: `0x${IotaSDK.bech32ToHex(address)}`,
                                        addressType: 0, // ED25519_ADDRESS_TYPE
                                        amount: output.output.amount,
                                        type: 3, // BASIC_OUTPUT_TYPE
                                        nativeTokens: [
                                            {
                                                id: tokenId,
                                                amount: `0x${curTotal.minus(totalSendTokenAmount).toString(16)}`
                                            }
                                        ],
                                        unlockConditions: [
                                            {
                                                type: 0, // ADDRESS_UNLOCK_CONDITION_TYPE
                                                address: IotaSDK.IotaObj.Bech32Helper.addressFromBech32(address, IotaSDK.info.protocol.bech32Hrp)
                                            }
                                        ]
                                    })
                                    inputsAndSignatureKeyPairs.push({
                                        input: {
                                            type: 0, // UTXO_INPUT_TYPE
                                            transactionId: output.metadata.transactionId,
                                            transactionOutputIndex: output.metadata.outputIndex
                                        },
                                        consumingOutput: output.output,
                                        addressKeyPair
                                    })
                                }
                            }
                        }
                        console.log(balance.valueOf())
                        console.log(sendSMRAmount.valueOf())
                        const sendOutput = {
                            address: `0x${IotaSDK.bech32ToHex(address)}`,
                            addressType: 0, // ED25519_ADDRESS_TYPE
                            amount: String(balance.minus(sendSMRAmount).valueOf()),
                            type: 3, // BASIC_OUTPUT_TYPE
                            nativeTokens: [],
                            unlockConditions: [
                                {
                                    type: 0, // ADDRESS_UNLOCK_CONDITION_TYPE
                                    address: IotaSDK.IotaObj.Bech32Helper.addressFromBech32(address, IotaSDK.info.protocol.bech32Hrp)
                                }
                            ]
                        }
                        const outputs = [sendOutput]
                        const initialAddressState = {
                            accountIndex: 0,
                            addressIndex: 0,
                            isInternal: false
                        }
                        const smrCalc = await IotaSDK.IotaObj.calculateInputs(IotaSDK.client, baseSeed, initialAddressState, IotaSDK.IotaObj.generateBip44Address, outputs, 20)
                        inputsAndSignatureKeyPairs = [...inputsAndSignatureKeyPairs, ...smrCalc]
                        outputList = [...outputList, sendOutput]
                        console.log(inputsAndSignatureKeyPairs, outputList)
                        const [isCanSend, tips] = IotaSDK.IotaObj.verifySMRSendParams(inputsAndSignatureKeyPairs, outputList)
                        if (!isCanSend) {
                            throw tips
                        }
                        const sendRes = await IotaSDK.IotaObj.sendAdvanced(IotaSDK.client, inputsAndSignatureKeyPairs, outputList, {
                            tag: IotaSDK.IotaObj.Converter.utf8ToBytes('TanglePay'),
                            data: undefined
                        })
                        console.log(sendRes)
                    } else {
                        const { seed, address } = curWallet
                        const baseSeed = IotaSDK.getSeed(seed, password)
                        const balanceRes = await IotaSDK.IotaObj.addressBalance(IotaSDK.client, address)
                        const balance = BigNumber(Number(balanceRes.available))
                        let decimal = Math.pow(10, IotaSDK.curNode.decimal)
                        let sendAmount = Number(BigNumber(amount).times(decimal))
                        const addressList = importList.map((e) => e['地址'])
                        console.log(addressList)
                        let sendSMRAmount = new BigNumber(0)
                        let totalSendTokenAmount = new BigNumber(0)
                        let outputList = addressList.map((e) => {
                            return {
                                addressBech32: e,
                                amount: sendAmount,
                                isDustAllowance: false
                            }
                        })

                        const sendRes = await IotaSDK.IotaObj.sendMultiple(
                            IotaSDK.client,
                            baseSeed,
                            0,
                            outputList,
                            {
                                tag: IotaSDK.IotaObj.Converter.utf8ToBytes('TanglePay'),
                                data: undefined
                            },
                            {
                                startIndex: 0,
                                zeroCount: 20
                            }
                        )
                        console.log(sendRes)
                    }
                }}>
                往导入地址中转入资产
            </Button>
        </div>
    )
}
