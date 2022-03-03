import React, { useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import ConfirmationModal from '@/components/elements/ConfirmationModal';
import wipeServer from '@/api/server/wipeServer';
import { Actions, useStoreActions } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import { httpErrorToHuman } from '@/api/http';
import tw from 'twin.macro';
import Button from '@/components/elements/Button';
import Switch from '@/components/elements/Switch';
import { PowerAction } from '@/components/server/ServerConsole';

export default () => {
    const uuid = ServerContext.useStoreState(state => state.server.data!.uuid);
    const instance = ServerContext.useStoreState(state => state.socket.instance);
    const [ isSubmitting, setIsSubmitting ] = useState(false);
    const [ modalVisible, setModalVisible ] = useState(false);
    const { addFlash, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const [ shouldRegenSeed, setRegenSeed ] = useState(true);
    const [ shouldDeleteWorld, setDeleteWorld ] = useState(true);
    const [ shouldDeletePlayerData, setDeletePlayerData ] = useState(false);

    const sendPowerCommand = (command: PowerAction) => {
        instance && instance.send('set state', command);
    };

    const wipe = () => {
        clearFlashes('settings');
        setIsSubmitting(true);

        sendPowerCommand('stop');

        setTimeout(() => {
            wipeServer(uuid, shouldRegenSeed, shouldDeleteWorld, shouldDeletePlayerData)
                .then(() => {
                    addFlash({
                        key: 'settings',
                        type: 'success',
                        message: 'Your server has been wiped.',
                    });
                    sendPowerCommand('restart');
                })
                .catch(error => {
                    console.error(error);
                    addFlash({ key: 'settings', type: 'error', message: httpErrorToHuman(error) });
                })
                .then(() => {
                    setIsSubmitting(false);
                    setModalVisible(false);
                });
        }, 3000);
    };

    useEffect(() => {
        clearFlashes();
    }, []);

    return (
        <TitledGreyBox title={'Wipe Rust Server'} css={tw`relative`}>
            <ConfirmationModal
                title={'Confirm server wipe'}
                buttonText={'Yes, wipe server'}
                onConfirmed={wipe}
                showSpinnerOverlay={isSubmitting}
                visible={modalVisible}
                onModalDismissed={() => setModalVisible(false)}
            >
                <p>Your server will be stopped and the selected data will be deleted, are you sure you wish to continue?</p>
                <p><b>This will only work for Rust servers!</b></p>
            </ConfirmationModal>
            <Switch
                name="shouldRegenSeed"
                label="Regenerate Seed"
                onChange={() => setRegenSeed(s => !s)}
                defaultChecked={shouldRegenSeed}
            />
            <div css={tw`mt-2 flex items-center w-full md:w-auto`}>
                <div>
                    <Switch
                        name="shouldDeleteWorld"
                        label="Delete World"
                        onChange={() => setDeleteWorld(s => !s)}
                        defaultChecked={shouldDeleteWorld}
                    />
                </div>
                <div css={tw`ml-4`}>
                    <Switch
                        name="shouldDeletePlayerData"
                        label="Delete Player Data"
                        onChange={() => setDeletePlayerData(s => !s)}
                        defaultChecked={shouldDeletePlayerData}
                    />
                </div>
            </div>
            <div css={tw`mt-6 text-right`}>
                <Button
                    type={'button'}
                    color={'red'}
                    isSecondary
                    onClick={() => setModalVisible(true)}
                >
                    Wipe Server
                </Button>
            </div>
        </TitledGreyBox>
    );
};
