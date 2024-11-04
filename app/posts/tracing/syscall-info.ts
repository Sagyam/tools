import { SyscallInfo } from './types'

export const syscallInfo: SyscallInfo = {
    execve: 'Executes a program referenced by a pathname',
    mmap: 'Maps files or devices into memory',
    openat: 'Opens a file relative to a directory file descriptor',
    pread64: 'Reads from a file descriptor at a given offset',
    close: 'Closes a file descriptor',
    fstat: 'Gets file status',
    access: "Checks user's permissions for a file",
    read: 'Reads from a file descriptor',
    arch_prctl: 'Sets architecture-specific thread state',
    brk: 'Changes the location of the program break',
}
