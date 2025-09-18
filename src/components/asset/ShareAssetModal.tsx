'use client'

import { useState, useEffect } from 'react'
import { Dialog, Transition, Switch, RadioGroup } from '@headlessui/react'
import { Fragment } from 'react'
import {
  XMarkIcon,
  LinkIcon,
  LockClosedIcon,
  GlobeAltIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import { useToast } from '@/contexts/ToastContext'

interface ShareAssetModalProps {
  isOpen: boolean
  onClose: () => void
  assetId: string
  assetTitle: string
  currentShareLink?: string
  lng?: string
}

type ShareAccess = 'public' | 'restricted' | 'password'
type ExpirationOption = 'never' | '1day' | '7days' | '30days' | 'custom'

export default function ShareAssetModal({
  isOpen,
  onClose,
  assetId,
  assetTitle,
  currentShareLink,
  lng = 'en'
}: ShareAssetModalProps) {
  const { showSuccess, showError, showInfo } = useToast()
  const [shareAccess, setShareAccess] = useState<ShareAccess>('restricted')
  const [expiration, setExpiration] = useState<ExpirationOption>('7days')
  const [customDate, setCustomDate] = useState('')
  const [password, setPassword] = useState('')
  const [allowDownload, setAllowDownload] = useState(true)
  const [requireAuth, setRequireAuth] = useState(false)
  const [shareLink, setShareLink] = useState(currentShareLink || '')
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [emails, setEmails] = useState('')
  const [shareMessage, setShareMessage] = useState('')

  useEffect(() => {
    if (currentShareLink) {
      setShareLink(currentShareLink)
    }
  }, [currentShareLink])

  const accessOptions = [
    {
      value: 'public',
      title: 'Public',
      description: 'Anyone with the link can view',
      icon: GlobeAltIcon
    },
    {
      value: 'restricted',
      title: 'Restricted',
      description: 'Only specific people can access',
      icon: UserGroupIcon
    },
    {
      value: 'password',
      title: 'Password Protected',
      description: 'Requires password to access',
      icon: LockClosedIcon
    }
  ]

  const expirationOptions = [
    { value: 'never', label: 'Never' },
    { value: '1day', label: '1 day' },
    { value: '7days', label: '7 days' },
    { value: '30days', label: '30 days' },
    { value: 'custom', label: 'Custom date' }
  ]

  const generateShareLink = async () => {
    setIsGenerating(true)
    
    try {
      // Calculate expiration date
      let expiresAt = null
      if (expiration !== 'never') {
        const now = new Date()
        switch (expiration) {
          case '1day':
            expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)
            break
          case '7days':
            expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
            break
          case '30days':
            expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
            break
          case 'custom':
            expiresAt = customDate ? new Date(customDate) : null
            break
        }
      }

      const response = await fetch(`/api/assets/${assetId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access: shareAccess,
          password: shareAccess === 'password' ? password : undefined,
          expiresAt: expiresAt?.toISOString(),
          allowDownload,
          requireAuth,
          emails: shareAccess === 'restricted' ? emails.split(',').map(e => e.trim()).filter(Boolean) : undefined,
          message: shareMessage || undefined
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        // Extract the message from the error object structure
        const errorMessage = errorData.error?.message || errorData.error || 'Failed to generate share link'
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      // The API already returns the full shareUrl with language prefix
      const fullLink = data.data?.shareUrl || `${window.location.origin}/${lng}/share/${data.data?.token || data.token}`
      setShareLink(fullLink)
      
      // Send email notifications if emails provided
      if (emails && shareAccess === 'restricted') {
        await sendShareNotifications(data.token)
      }
      
      showSuccess('Share Link Created', 'The share link has been generated and copied to clipboard.')
      
      // Copy to clipboard automatically
      if (fullLink) {
        navigator.clipboard.writeText(fullLink)
      }
      
      // Close the modal after a short delay to show the success message
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error) {
      console.error('Error generating share link:', error)
      showError('Share Failed', 'Failed to generate share link. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const sendShareNotifications = async (token: string) => {
    const emailList = emails.split(',').map(e => e.trim()).filter(Boolean)
    
    for (const email of emailList) {
      try {
        await fetch('/api/share/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            token,
            assetTitle,
            message: shareMessage
          })
        })
      } catch (error) {
        console.error(`Failed to notify ${email}:`, error)
      }
    }
  }

  const copyToClipboard = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink)
      setCopied(true)
      showInfo('Link Copied', 'Share link has been copied to your clipboard.')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const revokeShareLink = async () => {
    if (!shareLink) return
    
    try {
      const token = shareLink.split('/').pop()
      await fetch(`/api/share/${token}`, {
        method: 'DELETE'
      })
      setShareLink('')
      showSuccess('Link Revoked', 'The share link has been revoked successfully.')
    } catch (error) {
      console.error('Error revoking share link:', error)
      showError('Revoke Failed', 'Failed to revoke the share link. Please try again.')
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl transition-all">
                <Dialog.Title as="div" className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <LinkIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Share Asset
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {assetTitle}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </Dialog.Title>

                <div className="space-y-6">
                  {/* Access Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Access Level
                    </label>
                    <RadioGroup value={shareAccess} onChange={setShareAccess}>
                      <div className="space-y-2">
                        {accessOptions.map((option) => (
                          <RadioGroup.Option
                            key={option.value}
                            value={option.value}
                            className={({ checked }) =>
                              `relative flex cursor-pointer rounded-lg px-4 py-3 border ${
                                checked
                                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                              } transition-all`
                            }
                          >
                            {({ checked }) => (
                              <div className="flex items-center w-full">
                                <div className="flex items-center">
                                  <option.icon className={`w-5 h-5 mr-3 ${
                                    checked ? 'text-blue-600' : 'text-gray-400'
                                  }`} />
                                </div>
                                <div className="flex-1">
                                  <RadioGroup.Label
                                    as="p"
                                    className={`font-medium ${
                                      checked ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'
                                    }`}
                                  >
                                    {option.title}
                                  </RadioGroup.Label>
                                  <RadioGroup.Description
                                    as="p"
                                    className={`text-sm ${
                                      checked ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'
                                    }`}
                                  >
                                    {option.description}
                                  </RadioGroup.Description>
                                </div>
                              </div>
                            )}
                          </RadioGroup.Option>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Password Field (if password protected) */}
                  {shareAccess === 'password' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Password
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password for access"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required={shareAccess === 'password'}
                      />
                    </div>
                  )}

                  {/* Email Recipients (if restricted) */}
                  {shareAccess === 'restricted' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email Recipients
                      </label>
                      <textarea
                        value={emails}
                        onChange={(e) => setEmails(e.target.value)}
                        placeholder="Enter email addresses separated by commas"
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}

                  {/* Expiration */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Link Expiration
                    </label>
                    <select
                      value={expiration}
                      onChange={(e) => setExpiration(e.target.value as ExpirationOption)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {expirationOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    
                    {expiration === 'custom' && (
                      <input
                        type="datetime-local"
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                        className="mt-2 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                  </div>

                  {/* Options */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Allow Download
                      </label>
                      <Switch
                        checked={allowDownload}
                        onChange={setAllowDownload}
                        className={`${
                          allowDownload ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                      >
                        <span className={`${
                          allowDownload ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                      </Switch>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Require Authentication
                      </label>
                      <Switch
                        checked={requireAuth}
                        onChange={setRequireAuth}
                        className={`${
                          requireAuth ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                      >
                        <span className={`${
                          requireAuth ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                      </Switch>
                    </div>
                  </div>

                  {/* Optional Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Message (Optional)
                    </label>
                    <textarea
                      value={shareMessage}
                      onChange={(e) => setShareMessage(e.target.value)}
                      placeholder="Add a message for recipients"
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Share Link Display */}
                  {shareLink && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Share Link
                        </span>
                        <button
                          onClick={revokeShareLink}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Revoke Link
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={shareLink}
                          readOnly
                          className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
                        />
                        <button
                          onClick={copyToClipboard}
                          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          {copied ? (
                            <CheckIcon className="w-5 h-5" />
                          ) : (
                            <ClipboardDocumentIcon className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={generateShareLink}
                      disabled={isGenerating || (shareAccess === 'password' && !password)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                    >
                      {isGenerating ? 'Generating...' : shareLink ? 'Update Link' : 'Generate Link'}
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}