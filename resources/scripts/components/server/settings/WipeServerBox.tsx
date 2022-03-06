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
import { PowerAction } from '@/components/server/ServerConsole';
import { Textarea } from '@/components/elements/Input';
import Label from '@/components/elements/Label';
import { debounce } from 'debounce';

export default () => {
    const uuid = ServerContext.useStoreState(state => state.server.data!.uuid);
    const instance = ServerContext.useStoreState(state => state.socket.instance);
    const [ isSubmitting, setIsSubmitting ] = useState(false);
    const [ modalVisible, setModalVisible ] = useState(false);
    const { addFlash, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const currentPathList = ServerContext.useStoreState(state => state.server.data!.variables).filter(v => v.envVariable === 'WIPE_PATH_LIST')[0].serverValue;
    const [ pathList, setPathList ] = useState(currentPathList.split(',').join('\n') ?? '');

    const setPathListValue = debounce((value: string) => {
        setPathList(value);
    }, 500);

    const sendPowerCommand = (command: PowerAction) => {
        instance && instance.send('set state', command);
    };

    const wipe = () => {
        clearFlashes('settings');
        setIsSubmitting(true);

        sendPowerCommand('kill');

        setTimeout(() => {
            wipeServer(uuid, pathList.split('\n'))
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
        }, 1000);
    };

    useEffect(() => {
        clearFlashes();
    }, []);

    return (
        <TitledGreyBox title={'Wipe file saves'} css={tw`relative`}>
            <ConfirmationModal
                title={'Confirm server wipe'}
                buttonText={'Yes, wipe server'}
                onConfirmed={wipe}
                showSpinnerOverlay={isSubmitting}
                visible={modalVisible}
                onModalDismissed={() => setModalVisible(false)}
            >
                <p>Your server will be stopped and the selected data will be deleted, are you sure you wish to continue?</p>
            </ConfirmationModal>
            <div css={tw`mt-6`}>
                <Label>List of paths</Label>
                <Textarea
                    name="pathList"
                    title="List of paths"
                    defaultValue={pathList}
                    placeholder={'/folder1\n/folder2'}
                    onKeyUp={e => {
                        setPathListValue(e.currentTarget.value);
                    }}
                    rows={6}
                />
                <p css={tw`text-sm`}>
                    If you want this field to be filled automatically, you should add a variable called <b>WIPE_PATH_LIST</b> in your egg and set it to your default path list.
                    Check the Rust default one if needed.
                </p>
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
